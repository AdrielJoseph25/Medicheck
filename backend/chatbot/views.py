from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .rag_service import search_medical_knowledge, build_response

@api_view(['POST'])
def chat(request):
    """
    Main chat endpoint.
    Receives a symptom query, searches medical knowledge, returns grounded response.
    """
    query = request.data.get('message', '').strip()
    
    if not query:
        return Response(
            {'error': 'Please provide a message'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    if len(query) < 3:
        return Response(
            {'error': 'Message too short. Please describe your symptoms in more detail.'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Search medical knowledge base
    documents = search_medical_knowledge(query)
    
    # Build the response with citations
    result = build_response(query, documents)
    
    return Response({
        'query': query,
        'answer': result['answer'],
        'citations': result['citations'],
        'disclaimer': result['disclaimer'],
        'sources_found': len(documents)
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
def health_check(request):
    """Simple endpoint to check if the server is running"""
    return Response({'status': 'MediCheck API is running ✅'})