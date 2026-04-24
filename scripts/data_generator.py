import psycopg2, random, io, csv
from faker import Faker

fake = Faker('zh_CN')
conn = psycopg2.connect(dbname='genealogy', user='postgres', password='postgres', host='localhost')
cur = conn.cursor()

def generate_family(family_id: int, target_size: int, generations: int):
    """Generates members and relations for a family tree with a specific target size"""
    members, relations = [], []
    member_id_start = family_id * 1000000 
    
    # Simple linear-ish growth with randomness to hit the target size
    avg_per_gen = target_size // generations
    
    gen_members = {} 
    current_m_id = member_id_start
    
    for gen in range(1, generations + 1):
        gen_members[gen] = []
        # First gen always 1, then grow
        if gen == 1:
            count = 1
        elif gen == generations:
            count = target_size - (current_m_id - member_id_start)
        else:
            # Random count that trends upwards but keeps us on track for target
            remaining_size = target_size - (current_m_id - member_id_start)
            remaining_gens = generations - gen + 1
            count = random.randint(1, max(2, (remaining_size // remaining_gens) * 2))
        
        base_year = 1900 - (generations - gen) * 25
        for _ in range(count):
            gender = random.choice(['M', 'F'])
            birth = base_year + random.randint(0, 20)
            death = birth + random.randint(60, 90) if random.random() > 0.3 else None
            members.append((current_m_id, family_id, fake.name(),
                            gender, birth, death, gen))
            gen_members[gen].append(current_m_id)
            current_m_id += 1
            
    # Generate parent-child relationships (ensure every child has one parent from prev gen)
    for gen in range(2, generations + 1):
        parents = gen_members[gen - 1]
        children = gen_members[gen]
        if not parents: continue # Should not happen with count >= 1
        for child_id in children:
            parent_id = random.choice(parents)
            rtype = random.choice(['PARENT_SON', 'PARENT_DAUGHTER'])
            relations.append((family_id, parent_id, child_id, rtype))
            
    return members, relations

def setup_base_data():
    cur.execute("TRUNCATE TABLE members, relations, families, users CASCADE")
    cur.execute("INSERT INTO users (id, username, email, password) VALUES (1, 'admin', 'admin@example.com', 'admin') ON CONFLICT (id) DO NOTHING")
    for fid in range(1, 11):
        cur.execute("INSERT INTO families (id, name, owner_id) VALUES (%s, %s, %s) ON CONFLICT (id) DO NOTHING", (fid, f'Family_{fid}', 1))
    conn.commit()

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

setup_base_data()
for fid in range(1, 11):
    target = 55000 if fid == 1 else random.randint(3000, 8000)
    m, r = generate_family(fid, target, 32)
    bulk_insert(m, r)
    print(f'Family {fid}: {len(m)} members, {len(r)} relations')

cur.close(); conn.close()
print('Data generation complete!')
