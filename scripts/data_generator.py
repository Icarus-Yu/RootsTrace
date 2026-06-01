import psycopg2, random, io, csv
from psycopg2 import sql
from faker import Faker

fake = Faker('zh_CN')
conn = psycopg2.connect(dbname='genealogy', user='postgres', password='postgres', host='localhost')
cur = conn.cursor()

def sync_serial_sequences():
    """Keep BIGSERIAL sequences in sync after COPY/explicit-id imports."""
    for table in ('families', 'members', 'relations'):
        cur.execute(
            sql.SQL("""
            SELECT setval(
                pg_get_serial_sequence(%s, 'id'),
                COALESCE((SELECT MAX(id) FROM {table}), 1),
                (SELECT MAX(id) IS NOT NULL FROM {table})
            )
            """).format(table=sql.Identifier(table)),
            (table,),
        )
    conn.commit()

def generate_family(family_id: int, target_size: int, generations: int):
    """Generate a dense family tree: each child has both parents, couples have
    multiple children (siblings), spouses are linked with SPOUSE edges, and a
    small fraction of bloodline members remarry to produce half-siblings."""
    members, relations = [], []
    member_id_start = family_id * 1000000
    current_id = member_id_start
    gender_of: dict[int, str] = {}
    spouse_seen: set[tuple[int, int]] = set()

    def make_member(gen: int, gender: str) -> int:
        nonlocal current_id
        base_year = 1900 - (generations - gen) * 25
        birth = base_year + random.randint(0, 18)
        death = birth + random.randint(60, 90) if random.random() > 0.3 else None
        members.append((current_id, family_id, fake.name(), gender, birth, death, gen))
        gender_of[current_id] = gender
        mid = current_id
        current_id += 1
        return mid

    def add_spouse(a: int, b: int):
        key = (min(a, b), max(a, b))
        if key in spouse_seen:
            return
        spouse_seen.add(key)
        relations.append((family_id, a, b, 'SPOUSE'))

    def add_parent_edge(parent_id: int, child_id: int, child_gender: str):
        pg = gender_of[parent_id]
        if pg == 'M':
            rtype = 'PARENT_SON' if child_gender == 'M' else 'PARENT_DAUGHTER'
        else:
            rtype = 'MOTHER_SON' if child_gender == 'M' else 'MOTHER_DAUGHTER'
        relations.append((family_id, parent_id, child_id, rtype))

    # Gen 1: founding couple — both count as bloodline so the tree can branch
    bloodline = {1: [make_member(1, 'M'), make_member(1, 'F')]}
    add_spouse(bloodline[1][0], bloodline[1][1])
    total = 2

    for gen in range(2, generations + 1):
        prev = bloodline[gen - 1]
        if not prev or total >= target_size:
            break

        # Pair ~55% of previous bloodline (gender mix ≈ 50/50, so most who
        # want to marry can find someone). Let the family grow geometrically
        # and stop naturally when we hit target_size — do NOT cram a whole
        # generation's "budget" onto a handful of couples.
        couples_count = max(1, int(len(prev) * 0.55))
        couples_count = min(couples_count, len(prev))
        chosen = random.sample(prev, couples_count)

        couples = []
        for blood in chosen:
            if total >= target_size:
                break
            g = gender_of[blood]
            inlaw_g = 'F' if g == 'M' else 'M'
            inlaw = make_member(gen - 1, inlaw_g)
            total += 1
            add_spouse(blood, inlaw)
            father, mother = (blood, inlaw) if g == 'M' else (inlaw, blood)
            couples.append((father, mother))
            # ~5% remarriage → blended family with half-siblings
            if random.random() < 0.05 and total < target_size:
                inlaw2 = make_member(gen - 1, inlaw_g)
                total += 1
                add_spouse(blood, inlaw2)
                father2, mother2 = (blood, inlaw2) if g == 'M' else (inlaw2, blood)
                couples.append((father2, mother2))

        bloodline[gen] = []
        for father, mother in couples:
            if total >= target_size:
                break
            # Realistic family size: 1–5 children, weighted toward 2–3
            n = random.choices([1, 2, 3, 4, 5], weights=[1, 3, 4, 2, 1])[0]
            for _ in range(n):
                if total >= target_size:
                    break
                child_g = random.choice(['M', 'F'])
                child = make_member(gen, child_g)
                total += 1
                add_parent_edge(father, child, child_g)
                add_parent_edge(mother, child, child_g)
                bloodline[gen].append(child)

    return members, relations

def setup_base_data(target_username='ica'):
    # Do not truncate 'users' table to keep registered accounts
    cur.execute("TRUNCATE TABLE members, relations, families RESTART IDENTITY CASCADE")

    # Check if target user exists
    cur.execute("SELECT id FROM users WHERE username = %s", (target_username,))
    res = cur.fetchone()

    if res:
        owner_id = res[0]
        print(f"Using existing user '{target_username}' with ID: {owner_id}")
    else:
        # Fallback: create user if not exists
        cur.execute("INSERT INTO users (username, email, password) VALUES (%s, %s, %s) RETURNING id", 
                    (target_username, f"{target_username}@example.com", "password123"))
        owner_id = cur.fetchone()[0]
        print(f"Created new user '{target_username}' with ID: {owner_id}")

    for fid in range(1, 11):
        cur.execute("INSERT INTO families (id, name, owner_id) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING", 
                    (fid, f'Family_{fid}', owner_id))
    conn.commit()
    return owner_id

def bulk_insert(members, relations):
    m_buf = io.StringIO()
    for row in members:
        line = ','.join([str(val) if val is not None else '\\N' for val in row])
        m_buf.write(line + '\n')
    m_buf.seek(0)
    cur.copy_from(m_buf, 'members', columns=('id','family_id','name','gender','birth_year','death_year','generation'), sep=',')
    
    r_buf = io.StringIO()
    for row in relations:
        line = ','.join([str(val) if val is not None else '\\N' for val in row])
        r_buf.write(line + '\n')
    r_buf.seek(0)
    cur.copy_from(r_buf, 'relations', columns=('family_id','from_member_id','to_member_id','relation_type'), sep=',')
    conn.commit()

# Main execution
target_user = 'ica' 
setup_base_data(target_user)

for fid in range(1, 11):
    target = 55000 if fid == 1 else random.randint(3000, 8000)
    m, r = generate_family(fid, target, 32)
    bulk_insert(m, r)
    print(f'Family {fid}: {len(m)} members, {len(r)} relations')

sync_serial_sequences()
cur.close(); conn.close()
print('Data generation complete!')
