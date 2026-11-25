/**
 * JLICI's own illustrated scripture series, retained from the previous website
 * (jointlabourers.org media library, uploaded 2025). Files: /public/images/illustrations.
 * Each panel is 1080×1080 (luke-8-3-cropped is 1030×967) with the JLICI blue frame and logo.
 *
 * Not carried over: third-party comics in the old media library ("Elders D&C",
 * Arie Van De Graaff, William Fortune, Minq). They are other artists' work and
 * need a licence before use.
 */
export interface Illustration {
  file: string;
  reference: string;
  alt: string;
  theme: "prayer" | "giving" | "calling" | "watchman";
}

export const illustrations: Illustration[] = [
  { file: "luke-8-3.jpg", reference: "Luke 8:3", theme: "giving",
    alt: "Supporters bring provisions to a missionary family standing beside their mission van" },
  { file: "ezekiel-22-30.jpg", reference: "Ezekiel 22:30", theme: "calling",
    alt: "The Lord looks over a crowd for someone to stand in the gap, asking: are you available?" },
  { file: "philippians-2-25.jpg", reference: "Philippians 2:25; 4:16", theme: "giving",
    alt: "A co-labourer at his desk ticks off a missionary's list of needs: food, shelter, school fees" },
  { file: "ecclesiastes-3-1.jpg", reference: "Ecclesiastes 3:1", theme: "giving",
    alt: "A family's prayer for school fees is answered when a believer obeys God's prompting to give" },
  { file: "isaiah-62-6.jpg", reference: "Isaiah 62:6-7", theme: "prayer",
    alt: "Intercessors stand on a world map praying for America, Europe, Asia, Africa and Australia" },
  { file: "exodus-32-10.jpg", reference: "Exodus 32:10-14; Psalm 106:23", theme: "prayer",
    alt: "A man kneels in a dry land, standing in the gap in prayer for his nation" },
  { file: "isaiah-59-15.jpg", reference: "Isaiah 59:15-16", theme: "prayer",
    alt: "Believers wake in the night to pray for families who are in danger" },
  { file: "ephesians-6-18.jpg", reference: "Ephesians 6:18; 1 Thessalonians 5:17", theme: "prayer",
    alt: "A man kneels in an open field, praying for his brothers and sisters" },
  { file: "matthew-26-41-watch.jpg", reference: "Matthew 26:41; Luke 21:36", theme: "watchman",
    alt: "A heavenly figure wakes a sleeping watchman: stand upon your watch" },
  { file: "matthew-26-41-arise.jpg", reference: "Matthew 26:41; Luke 21:36", theme: "watchman",
    alt: "A heavenly figure strengthens a weary watchman: arise, watch and pray" },
  { file: "habakkuk-2-1.jpg", reference: "Habakkuk 2:1-3; Isaiah 21:6", theme: "watchman",
    alt: "A watchman writes down the vision at his desk" },
  { file: "ezekiel-3-17.jpg", reference: "Ezekiel 3:17; Romans 6:13", theme: "watchman",
    alt: "A watchman climbs steps of sacrifice and faithfulness up to his duty post" },
  { file: "gatekeepers-duty-post.jpg", reference: "The duty post of the gatekeepers", theme: "watchman",
    alt: "Co-labourers pray over government, the judiciary and the market place" },
  { file: "proverbs-8-15.jpg", reference: "Proverbs 8:10-15; Daniel 1:17", theme: "calling",
    alt: "Co-labourers carry godly influence into politics and the market place" },
  { file: "esther-4-14.jpg", reference: "Esther 4:14; Isaiah 62:6-7", theme: "calling",
    alt: "Watchmen intercessors kneel in prayer, ready for such a time as this" },
  { file: "exodus-31-3.jpg", reference: "Exodus 31:3", theme: "calling",
    alt: "Labourers gather at a tent labelled School of the Spirit" },
  { file: "acts-6-3.jpg", reference: "Acts 6:3, 5", theme: "calling",
    alt: "A co-labourer kneels in prayer as gifts are lifted heavenward: a priesthood that is sacrificial and faithful" },
  { file: "revelation-4-10.jpg", reference: "Revelation 4:10-11; Psalm 24:1", theme: "calling",
    alt: "Co-labourers cast their crowns before the throne in worship" },
];

export function illustration(file: string): Illustration {
  const found = illustrations.find((i) => i.file === file);
  if (!found) throw new Error(`Unknown illustration ${file}`);
  return found;
}

export const ILLUSTRATION_SIZE = { width: 1080, height: 1080 };
