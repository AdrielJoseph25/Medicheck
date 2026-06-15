import os
import sys
import django

# Setup Django settings
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.conf import settings
from pinecone import Pinecone, ServerlessSpec
from sentence_transformers import SentenceTransformer

print("Connecting to Pinecone...")
pc = Pinecone(api_key=settings.PINECONE_API_KEY)

INDEX_NAME = settings.PINECONE_INDEX_NAME
DIMENSION = 384  # all-MiniLM-L6-v2 produces 384-dimensional vectors

# Create index if it doesn't exist or has wrong dimension
import time
existing_indexes = pc.list_indexes()
existing_index_names = [idx.name for idx in existing_indexes]

if INDEX_NAME in existing_index_names:
    desc = pc.describe_index(INDEX_NAME)
    if desc.dimension != DIMENSION:
        print(f"Index '{INDEX_NAME}' exists but has dimension {desc.dimension} (expected {DIMENSION}). Recreating index...")
        pc.delete_index(INDEX_NAME)
        # Wait for deletion to complete
        print("Waiting for index deletion to complete...")
        while INDEX_NAME in [idx.name for idx in pc.list_indexes()]:
            time.sleep(1)
        
        print("Creating index with correct dimension...")
        pc.create_index(
            name=INDEX_NAME,
            dimension=DIMENSION,
            metric='cosine',
            spec=ServerlessSpec(cloud='aws', region='us-east-1')
        )
        print("Index created!")
    else:
        print(f"Index '{INDEX_NAME}' already exists with the correct dimension.")
else:
    print(f"Creating index '{INDEX_NAME}'...")
    pc.create_index(
        name=INDEX_NAME,
        dimension=DIMENSION,
        metric='cosine',
        spec=ServerlessSpec(cloud='aws', region='us-east-1')
    )
    print("Index created!")


index = pc.Index(INDEX_NAME)

# Sample verified medical knowledge base
MEDICAL_DOCUMENTS = [
    {
        "id": "doc_001",
        "text": "Fever is a temporary increase in body temperature, often due to illness. A fever is generally considered to be a temperature of 38°C (100.4°F) or higher. Common causes include viral infections like flu, bacterial infections, heat exhaustion, and certain medications. Symptoms accompanying fever often include sweating, chills, headache, muscle aches, and fatigue.",
        "source": "MedlinePlus - Fever"
    },
    {
        "id": "doc_002",
        "text": "Headaches are one of the most common health complaints. Tension headaches cause dull, aching pain and a sensation of tightness or pressure across the forehead or the sides and back of the head. Migraine headaches cause intense throbbing pain, often on one side of the head, accompanied by nausea, vomiting, and sensitivity to light and sound.",
        "source": "Mayo Clinic - Headache"
    },
    {
        "id": "doc_003",
        "text": "Common cold symptoms include runny or stuffy nose, sore throat, cough, congestion, slight body aches or headache, sneezing, low-grade fever, and generally feeling unwell. Symptoms usually appear 1-3 days after exposure to the virus. Most colds resolve within 7-10 days.",
        "source": "Mayo Clinic - Common Cold"
    },
    {
        "id": "doc_004",
        "text": "Chest pain can be caused by many different conditions. Heart-related chest pain includes heaviness, pressure, tightness, or squeezing in the chest. Non-cardiac causes include acid reflux (GERD), costochondritis (inflammation of rib cartilage), anxiety, and pneumonia. Seek immediate medical attention if chest pain is severe, spreads to the arm or jaw, or is accompanied by shortness of breath.",
        "source": "NHS - Chest Pain"
    },
    {
        "id": "doc_005",
        "text": "Stomach pain or abdominal pain can have many causes. Common causes include indigestion, gas, irritable bowel syndrome (IBS), constipation, gastroenteritis (stomach flu), appendicitis, and ulcers. Severe abdominal pain, especially with fever, vomiting blood, or inability to keep food down, requires immediate medical evaluation.",
        "source": "MedlinePlus - Abdominal Pain"
    },
    {
        "id": "doc_006",
        "text": "Fatigue or extreme tiredness can result from many causes including anemia, thyroid disorders, diabetes, sleep disorders like sleep apnea, depression, and chronic fatigue syndrome. Persistent unexplained fatigue lasting more than two weeks should be evaluated by a healthcare provider.",
        "source": "MedlinePlus - Fatigue"
    },
    {
        "id": "doc_007",
        "text": "Shortness of breath (dyspnea) can be caused by asthma, chronic obstructive pulmonary disease (COPD), pneumonia, heart failure, anemia, anxiety disorders, or physical deconditioning. Sudden severe shortness of breath is a medical emergency. Mild shortness of breath during exercise is usually normal.",
        "source": "Mayo Clinic - Shortness of Breath"
    },
    {
        "id": "doc_008",
        "text": "Dizziness can mean different things including feeling faint (presyncope), loss of balance, or a false sense of spinning (vertigo). Common causes include benign paroxysmal positional vertigo (BPPV), inner ear infections, Meniere's disease, low blood pressure, dehydration, and anemia. Dizziness with chest pain, severe headache, or neurological symptoms requires emergency care.",
        "source": "Mayo Clinic - Dizziness"
    },
    {
        "id": "doc_009",
        "text": "Nausea and vomiting are symptoms that can be caused by many conditions. Common causes include viral gastroenteritis, food poisoning, motion sickness, pregnancy (morning sickness), migraines, medications, and anxiety. Dehydration from prolonged vomiting is a concern, especially in children and elderly. Seek medical attention if vomiting lasts more than 24 hours or contains blood.",
        "source": "MedlinePlus - Nausea and Vomiting"
    },
    {
        "id": "doc_010",
        "text": "Back pain is extremely common and can range from a dull, constant ache to a sudden, sharp sensation. Acute back pain comes on suddenly and usually lasts less than 6 weeks. Chronic back pain persists for more than 3 months. Common causes include muscle or ligament strain, disc herniation, arthritis, and osteoporosis. Most back pain improves with rest, pain relievers, and physical therapy.",
        "source": "Mayo Clinic - Back Pain"
    },
]

print("Loading embedding model...")
model = SentenceTransformer('all-MiniLM-L6-v2')
print("Embedding and uploading medical documents...")

vectors = []
for doc in MEDICAL_DOCUMENTS:
    embedding = model.encode(doc['text']).tolist()
    vectors.append({
        'id': doc['id'],
        'values': embedding,
        'metadata': {
            'text': doc['text'],
            'source': doc['source']
        }
    })

# Upload to Pinecone in batches
index.upsert(vectors=vectors)
print(f"✅ Successfully uploaded {len(vectors)} medical documents to Pinecone!")
print("Your MediCheck knowledge base is ready!")