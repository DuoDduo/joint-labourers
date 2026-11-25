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


async def test_impact_stats(client: AsyncClient) -> None:
    s = (await client.get("/stats/impact")).json()
    assert s["missionariesSupported"] >= 4
    assert s["prayerHoursCovered"] > 0
    assert s["territories"] >= 4
