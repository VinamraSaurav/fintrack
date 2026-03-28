-- Migration: 0008_trim_seed_aliases
-- Keep seeded aliases focused on exact canonical phrases and true transliteration/spelling variants.
-- 1. Remove the broad semantic aliases introduced by 0005_expanded_seed (the *_0, *_1, ... rows).
DELETE FROM aliases
WHERE id GLOB 'a_seed_*_[0-9]*';

-- 2. Remove previously learned low-confidence alias guesses so the stricter resolver can rebuild only safe matches.
DELETE FROM aliases
WHERE confidence < 1.0;
