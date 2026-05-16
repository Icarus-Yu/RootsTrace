-- Performance comparison for the database report.
-- Usage:
--   psql -d genealogy -v family_id=1 -v ancestor_id=1 -v target_depth=3 -f scripts/performance_compare.sql
--
-- Notes:
--   target_depth=3 means:
--     depth 0 = the selected ancestor
--     depth 1 = child
--     depth 2 = grandchild
--     depth 3 = great-grandchild
--   If your report defines "four generations after the ancestor" instead,
--   run with -v target_depth=4.

\timing on

\echo '============================================================'
\echo 'Parameters'
\echo 'family_id     = ' :family_id
\echo 'ancestor_id   = ' :ancestor_id
\echo 'target_depth  = ' :target_depth
\echo '============================================================'

\echo ''
\echo '1. Current indexes'
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('members', 'relations')
ORDER BY tablename, indexname;

\echo ''
\echo '2. Drop relation traversal indexes for the no-index run'
DROP INDEX IF EXISTS idx_relations_from;
DROP INDEX IF EXISTS idx_relations_to;
ANALYZE members;
ANALYZE relations;

\echo ''
\echo '3. EXPLAIN ANALYZE without relation traversal indexes'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
WITH RECURSIVE descendants AS (
    SELECT
        m.id,
        m.name,
        m.generation,
        0 AS depth
    FROM members m
    WHERE m.family_id = :family_id
      AND m.id = :ancestor_id

    UNION ALL

    SELECT
        child.id,
        child.name,
        child.generation,
        descendants.depth + 1 AS depth
    FROM descendants
    JOIN relations r
      ON r.family_id = :family_id
     AND r.from_member_id = descendants.id
     AND r.relation_type IN ('PARENT_SON', 'PARENT_DAUGHTER', 'MOTHER_SON', 'MOTHER_DAUGHTER')
    JOIN members child
      ON child.id = r.to_member_id
    WHERE descendants.depth < :target_depth
)
SELECT COUNT(*) AS great_grandchild_count
FROM descendants
WHERE depth = :target_depth;

\echo ''
\echo '4. Recreate relation traversal indexes for the indexed run'
CREATE INDEX IF NOT EXISTS idx_relations_from
    ON relations (family_id, from_member_id);
CREATE INDEX IF NOT EXISTS idx_relations_to
    ON relations (family_id, to_member_id);
ANALYZE members;
ANALYZE relations;

\echo ''
\echo '5. EXPLAIN ANALYZE with relation traversal indexes'
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
WITH RECURSIVE descendants AS (
    SELECT
        m.id,
        m.name,
        m.generation,
        0 AS depth
    FROM members m
    WHERE m.family_id = :family_id
      AND m.id = :ancestor_id

    UNION ALL

    SELECT
        child.id,
        child.name,
        child.generation,
        descendants.depth + 1 AS depth
    FROM descendants
    JOIN relations r
      ON r.family_id = :family_id
     AND r.from_member_id = descendants.id
     AND r.relation_type IN ('PARENT_SON', 'PARENT_DAUGHTER', 'MOTHER_SON', 'MOTHER_DAUGHTER')
    JOIN members child
      ON child.id = r.to_member_id
    WHERE descendants.depth < :target_depth
)
SELECT COUNT(*) AS great_grandchild_count
FROM descendants
WHERE depth = :target_depth;

\echo ''
\echo '6. Indexes after restore'
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('members', 'relations')
ORDER BY tablename, indexname;
