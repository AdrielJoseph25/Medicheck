import os
from sentence_transformers import SentenceTransformer
from pinecone import Pinecone
from django.conf import settings

print("Loading embedding model...")
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
print("Model loaded!")

def get_pinecone_index():
    pc = Pinecone(api_key=settings.PINECONE_API_KEY)
    return pc.Index(settings.PINECONE_INDEX_NAME)

def embed_text(text):
    return embedding_model.encode(text).tolist()

def search_medical_knowledge(query, top_k=3):
    try:
        index = get_pinecone_index()
        query_vector = embed_text(query)
        results = index.query(
            vector=query_vector,
            top_k=top_k,
            include_metadata=True
        )
        documents = []
        for match in results['matches']:
            if match['score'] > 0.3:
                documents.append({
                    'text': match['metadata'].get('text', ''),
                    'source': match['metadata'].get('source', 'Medical Database'),
                    'score': round(match['score'], 2)
                })
        return documents
    except Exception as e:
        print(f"Pinecone search error: {e}")
        return []

def build_response(query, documents):
    if not documents:
        return {
            'answer': (
                "I wasn't able to find specific information about your symptoms "
                "in my verified medical database.\n\n"
                "This could mean:\n"
                "• Your symptoms may need a combination of search terms\n"
                "• The condition may require specialist evaluation\n\n"
                "Please consult a qualified healthcare professional for an accurate assessment."
            ),
            'citations': [],
            'disclaimer': get_disclaimer()
        }

    # Build a clean structured answer
    answer = build_structured_answer(query, documents)

    citations = [
        {
            'number': i + 1,
            'source': doc['source'],
            'relevance_score': doc['score'],
            'text': doc['text']
        }
        for i, doc in enumerate(documents)
    ]

    return {
        'answer': answer,
        'citations': citations,
        'disclaimer': get_disclaimer()
    }

def build_structured_answer(query, documents):
    """Build a clean, readable answer from retrieved documents"""

    # Collect key info from all documents
    all_text = " ".join([doc['text'] for doc in documents])

    answer = "Based on verified medical sources, here is relevant information:\n\n"

    # Add content from each source
    for i, doc in enumerate(documents):
        text = doc['text']
        # Take the most relevant sentence (first 2-3 sentences)
        sentences = text.split('. ')
        summary = '. '.join(sentences[:3]) + '.'
        answer += f"📋 {summary}\n\n"

    answer += "─────────────────────────────\n"
    answer += "💡 What you should do:\n"
    answer += "• Monitor your symptoms carefully\n"
    answer += "• Stay hydrated and get adequate rest\n"
    answer += "• Consult a doctor if symptoms persist or worsen\n"
    answer += "• Seek emergency care for severe or sudden symptoms\n"

    return answer

def get_disclaimer():
    return (
        "⚠️ MEDICAL DISCLAIMER: This information is for educational purposes only "
        "and does not constitute medical advice, diagnosis, or treatment. "
        "Always consult a qualified healthcare professional for medical concerns. "
        "In case of emergency, call 911."
    )