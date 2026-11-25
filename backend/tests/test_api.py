"""HTTP-level tests against the FastAPI app with a seeded SQLite database."""

from httpx import AsyncClient

from tests.conftest import login, make_user


async def test_health(client: AsyncClient) -> None:
    assert (await client.get("/health")).json() == {"status": "ok"}
    assert (await client.get("/health/ready")).json() == {"status": "ready"}


async def test_errors_are_problem_json(client: AsyncClient) -> None:
    r = await client.get("/needs/JLN-9999")
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("application/problem+json")
    assert r.json()["title"] == "Need not found"


# ── auth ─────────────────────────────────────────────────────────────────────
async def test_register_login_refresh_logout(client: AsyncClient) -> None:
    r = await client.post(
        "/auth/register",
        json={"email": "Ada@Example.org", "password": "a-long-password", "firstName": "Ada"},
    )
    assert r.status_code == 201, r.text
    assert r.json()["user"]["roles"] == ["PARTNER"]
    assert "jl_at" in r.cookies

    assert (await client.get("/auth/me")).json()["user"]["email"] == "ada@example.org"
    dup = await client.post(
        "/auth/register",
        json={"email": "ada@example.org", "password": "a-long-password", "firstName": "A"},
    )
    assert dup.status_code == 409

    bad = await client.post("/auth/login", json={"email": "ada@example.org", "password": "nope"})
    assert bad.status_code == 401
    ok = await client.post(
        "/auth/login", json={"email": "ada@example.org", "password": "a-long-password"}
    )
    assert ok.status_code == 200

    old_refresh = client.cookies.get("jl_rt")
    assert (await client.post("/auth/refresh")).status_code == 200
    assert client.cookies.get("jl_rt") != old_refresh  # rotated

    assert (await client.post("/auth/logout")).status_code == 204
    client.cookies.clear()
    assert (await client.get("/auth/me")).status_code == 401


async def test_staff_need_totp_to_log_in(client: AsyncClient) -> None:
    await make_user("fin@example.org", ["FINANCE"])
    r = await client.post(
        "/auth/login", json={"email": "fin@example.org", "password": "correct-horse-battery"}
    )
    assert r.status_code == 401
    assert r.json()["type"].endswith("totp-required")
    await login(client, "fin@example.org")


async def test_staff_without_2fa_are_blocked_from_admin(client: AsyncClient) -> None:
    await make_user("no2fa@example.org", ["ADMIN"], totp=False)
    await login(client, "no2fa@example.org", totp=False)
    me = (await client.get("/auth/me")).json()
    assert me["requiresTwoFactorSetup"] is True
    r = await client.post("/admin/needs/x/transition", json={"action": "approve"})
    assert r.status_code == 403
    assert r.json()["type"].endswith("2fa-required")


# ── needs ────────────────────────────────────────────────────────────────────
async def test_needs_board_lists_live_needs_with_progress(client: AsyncClient) -> None:
    r = await client.get("/needs")
    body = r.json()
    assert r.status_code == 200
    codes = [n["code"] for n in body["data"]]
    assert "JLN-0006" not in codes  # funded need is not "live"
    first = body["data"][0]
    assert isinstance(first["targetMinor"], str)  # BigInt-safe
    assert first["coverImage"].startswith("/images/illustrations/")

    almost = (await client.get("/needs", params={"almostThere": "true"})).json()["data"]
    assert [n["code"] for n in almost] == ["JLN-0002"]  # 80%

    fulfilled = (await client.get("/needs", params={"status": "fulfilled"})).json()["data"]
    assert [n["code"] for n in fulfilled] == ["JLN-0006"]


async def test_need_detail_hides_sensitive_identity(client: AsyncClient) -> None:
    d = (await client.get("/needs/jln-0001")).json()
    assert d["percent"] == 62
    assert d["availableMinor"] == str((380_000 - 236_000) * 100)
    assert d["missionary"]["publicName"] == "Brother E."
    assert d["missionary"]["isSensitive"] is True
    assert "legalNameEnc" not in d["missionary"]


async def test_need_lifecycle_and_permissions(client: AsyncClient) -> None:
    await make_user("field@example.org", ["FIELD_COORDINATOR"])
    await login(client, "field@example.org")
    created = await client.post(
        "/admin/needs",
        json={
            "title": "Generator fuel for a rural clinic",
            "summary": "Fuel for three months so the clinic can run at night.",
            "story": "The clinic serves four villages and loses power every evening.",
            "category": "MEDICAL",
            "regionSlug": "west-africa",
            "targetMinor": 9_000_000,
        },
    )
    assert created.status_code == 201, created.text
    need = created.json()
    assert need["status"] == "DRAFT" and need["code"].startswith("JLN-")

    submit = await client.post(f"/admin/needs/{need['id']}/transition", json={"action": "submit"})
    assert submit.json()["status"] == "IN_REVIEW"
    nope = await client.post(f"/admin/needs/{need['id']}/transition", json={"action": "approve"})
    assert nope.status_code == 403  # coordinators cannot approve

    client.cookies.clear()
    await make_user("admin@example.org", ["ADMIN"])
    await login(client, "admin@example.org")
    ok = await client.post(f"/admin/needs/{need['id']}/transition", json={"action": "approve"})
    assert ok.json()["status"] == "OPEN"
    bad = await client.post(f"/admin/needs/{need['id']}/transition", json={"action": "approve"})
    assert bad.status_code == 409
    assert (await client.get(f"/needs/{need['code']}")).status_code == 200


async def test_anonymous_cannot_create_needs(client: AsyncClient) -> None:
    client.cookies.clear()
    assert (await client.post("/admin/needs", json={})).status_code in (401, 422)


# ── prayer ───────────────────────────────────────────────────────────────────
async def test_prayer_hubs_and_commitment(client: AsyncClient) -> None:
    hubs = (await client.get("/prayer/hubs")).json()
    assert [h["hub"] for h in hubs] == ["SYDNEY", "LAGOS", "NEW_YORK", "VANCOUVER"]

    body = {
        "fullName": "Grace V.",
        "email": "grace@example.org",
        "hub": "VANCOUVER",
        "timezone": "America/Vancouver",
        "localWeekday": 2,
        "localHour": 7,
        "consent": True,
    }
    r = await client.post("/prayer/commitments", json=body)
    assert r.status_code == 201, r.text
    assert r.json()["hourUtc"] in (14, 15)  # PDT / PST
    assert (await client.post("/prayer/commitments", json=body)).status_code == 409

    bad_tz = await client.post(
        "/prayer/commitments", json={**body, "email": "x@example.org", "timezone": "EST+5"}
    )
    assert bad_tz.status_code == 422

    cells = (await client.get("/prayer/coverage")).json()
    assert sum(c["count"] for c in cells) > 0


# ── prayer watches ───────────────────────────────────────────────────────────
WATCH_PERSON = {
    "firstName": "Esther",
    "lastName": "K.",
    "phone": "+2348012345678",
    "email": "esther@example.org",
    "hub": "LAGOS",
    "timezone": "Africa/Lagos",
    "consent": True,
}
CHAIN = "/prayer/watches/labourers-fast-feb-mar-2027"
CYCLE = "/prayer/watches/quarterly-24-hour-watch-q1-2027"


async def test_watch_list_and_detail(client: AsyncClient) -> None:
    slugs = [w["slug"] for w in (await client.get("/prayer/watches")).json()]
    assert "quarterly-24-hour-watch-q1-2027" in slugs
    detail = (await client.get(CYCLE)).json()
    assert len(detail["rounds"]) == 1
    assert len(detail["rounds"][0]["slots"]) == 8
    chain = (await client.get(CHAIN)).json()
    assert [r["label"] for r in chain["rounds"]] == ["February fast", "March fast"]
    # Times always carry a UTC marker, so browsers never read them as local time
    first = detail["rounds"][0]["slots"][0]["startsAt"]
    assert first.endswith("Z") or first.endswith("+00:00"), first
    assert (await client.get("/prayer/watches/nope")).status_code == 404


async def test_watch_signup_rules(client: AsyncClient) -> None:
    feb, mar = (await client.get(CHAIN)).json()["rounds"]
    url = f"{CHAIN}/signups"

    # A shift is needed in every required round
    r = await client.post(url, json={**WATCH_PERSON, "slotIds": [feb["slots"][0]["id"]]})
    assert r.status_code == 422
    assert r.json()["type"].endswith("shift-required")
    # Only one shift per round
    two = [feb["slots"][0]["id"], feb["slots"][1]["id"]]
    r = await client.post(url, json={**WATCH_PERSON, "slotIds": two})
    assert r.status_code == 422
    assert r.json()["type"].endswith("one-shift-per-round")
    # Phone must be in international format
    pair = [feb["slots"][0]["id"], mar["slots"][0]["id"]]
    bad = {**WATCH_PERSON, "phone": "08012345678", "slotIds": pair}
    assert (await client.post(url, json=bad)).status_code == 422

    picks = [feb["slots"][2]["id"], mar["slots"][4]["id"]]
    ok = await client.post(url, json={**WATCH_PERSON, "slotIds": picks})
    assert ok.status_code == 201, ok.text
    assert [s["roundLabel"] for s in ok.json()["slots"]] == ["February fast", "March fast"]
    others = [feb["slots"][3]["id"], mar["slots"][5]["id"]]
    assert (await client.post(url, json={**WATCH_PERSON, "slotIds": others})).status_code == 409

    after = (await client.get(CHAIN)).json()
    assert after["rounds"][0]["slots"][2]["taken"] == 1


async def test_watch_shift_capacity(client: AsyncClient) -> None:
    slot = (await client.get(CYCLE)).json()["rounds"][0]["slots"][0]
    url = f"{CYCLE}/signups"
    for i in range(slot["capacity"]):
        body = {**WATCH_PERSON, "email": f"cap{i}@example.org", "slotIds": [slot["id"]]}
        r = await client.post(url, json=body)
        assert r.status_code == 201, r.text
    late = {**WATCH_PERSON, "email": "late@example.org", "slotIds": [slot["id"]]}
    full = await client.post(url, json=late)
    assert full.status_code == 409
    assert full.json()["type"].endswith("shift-full")


async def test_impact_stats(client: AsyncClient) -> None:
    s = (await client.get("/stats/impact")).json()
    assert s["missionariesSupported"] >= 4
    assert s["prayerHoursCovered"] > 0
    assert s["territories"] >= 4
