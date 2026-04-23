-- 鍚敤 pgcrypto 鎵╁睍锛圲UID 鐢熸垚锛
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==================== users ====================
CREATE TABLE IF NOT EXISTS users (
    id          BIGSERIAL PRIMARY KEY,
    username    VARCHAR(50)  NOT NULL UNIQUE,
    email       VARCHAR(100) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ==================== families ====================
CREATE TABLE IF NOT EXISTS families (
    id              BIGSERIAL PRIMARY KEY,
    name            VARCHAR(100) NOT NULL,
    surname         VARCHAR(50),
    compiled_at     DATE,
    owner_id        BIGINT NOT NULL REFERENCES users(id),
    deleted_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== family_collaborators ====================
CREATE TABLE IF NOT EXISTS family_collaborators (
    family_id   BIGINT NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id     BIGINT NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    joined_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (family_id, user_id)
);

-- ==================== members ====================
CREATE TABLE IF NOT EXISTS members (
    id              BIGSERIAL PRIMARY KEY,
    family_id       BIGINT      NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    gender          CHAR(1)     NOT NULL CHECK (gender IN ('M','F')),
    birth_year      INT         CHECK (birth_year > 0),
    death_year      INT         CHECK (death_year IS NULL OR death_year >= birth_year),
    bio             TEXT,
    generation      INT         NOT NULL DEFAULT 1 CHECK (generation > 0),
    created_by      BIGINT      REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==================== relations ====================
-- PostgreSQL Enum Type (Check if exists before creating)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'relation_type_enum') THEN
        CREATE TYPE relation_type_enum AS ENUM (
            'PARENT_SON', 'PARENT_DAUGHTER',
            'MOTHER_SON', 'MOTHER_DAUGHTER',
            'SPOUSE'
        );
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS relations (
    id              BIGSERIAL PRIMARY KEY,
    family_id       BIGINT          NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    from_member_id  BIGINT          NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
    to_member_id    BIGINT          NOT NULL REFERENCES members(id)  ON DELETE CASCADE,
    relation_type   relation_type_enum NOT NULL,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_relation UNIQUE (family_id, from_member_id, to_member_id, relation_type)
);

-- 鐖惰緢鍑虹敓骞寸害鏉燂紙CHECK 瑙﹀彂鍣ㄥ疄鐜帮紝鏃犳硶鐢ㄥ崟绾 CHECK 璺ㄨ锛
CREATE OR REPLACE FUNCTION check_parent_birth_year()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    parent_birth INT; child_birth INT;
BEGIN
    IF NEW.relation_type IN ('PARENT_SON','PARENT_DAUGHTER','MOTHER_SON','MOTHER_DAUGHTER') THEN
        SELECT birth_year INTO parent_birth FROM members WHERE id = NEW.from_member_id;
        SELECT birth_year INTO child_birth  FROM members WHERE id = NEW.to_member_id;
        IF parent_birth IS NOT NULL AND child_birth IS NOT NULL
           AND parent_birth >= child_birth THEN
            RAISE EXCEPTION '鐖/姣嶅嚭鐢熷勾浠藉繀椤绘棭浜庡瓙濂筹紝鐖: %, 瀛: %', parent_birth, child_birth;
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_check_parent_birth ON relations;
CREATE TRIGGER trg_check_parent_birth
    BEFORE INSERT OR UPDATE ON relations
    FOR EACH ROW EXECUTE FUNCTION check_parent_birth_year();

-- ==================== audit_log ====================
CREATE TABLE IF NOT EXISTS audit_log (
    id          BIGSERIAL PRIMARY KEY,
    table_name  VARCHAR(50)  NOT NULL,
    operation   VARCHAR(10)  NOT NULL,
    record_id   BIGINT,
    operator_id BIGINT       REFERENCES users(id),
    operated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- ==================== 绱㈠紩 ====================
-- 鎴愬憳濮撳悕妯＄硦鏌ヨ锛坧g_trgm 涓夊厓缁勭储寮曪級
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_members_name_trgm
    ON members USING GIN (name gin_trgm_ops);

-- 鎸夌埗鑺傜偣鏌ュ瓙鑺傜偣
CREATE INDEX IF NOT EXISTS idx_relations_from
    ON relations (family_id, from_member_id);
CREATE INDEX IF NOT EXISTS idx_relations_to
    ON relations (family_id, to_member_id);

-- 鏃忚氨涓嬫垚鍛樹唬闄呮煡璇
CREATE INDEX IF NOT EXISTS idx_members_family_generation
    ON members (family_id, generation);
