from django.db import models
from f_user.models import User

class UChatbotHistory(models.Model):
    seq_id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    deleted_at = models.DateTimeField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    title = models.CharField(max_length=255)

    class Meta:
        db_table = "u_chatbot_history"

class UChatbotSession(models.Model):
    class MessageFrom(models.TextChoices):
        AI = "AI"
        USER = "USER"

    seq_id = models.BigAutoField(primary_key=True)
    chatbot_history = models.ForeignKey(UChatbotHistory, on_delete=models.CASCADE, related_name="messages")
    content_from = models.CharField(max_length=8, choices=MessageFrom.choices, default=MessageFrom.USER)
    content = models.CharField(max_length=4000)
    sent_at = models.DateTimeField()

    class Meta:
        db_table = "u_chatbot_session"

class ChatbotRetrivalEvent(models.Model):
    seq_id = models.BigAutoField(primary_key=True)
    session_msg = models.ForeignKey(UChatbotSession, on_delete=models.CASCADE, related_name="retrieval_events")
    retriever = models.CharField(max_length=64)  # BM25, FAISS 등
    query_text = models.TextField()
    k = models.IntegerField(default=5)
    score_type = models.CharField(max_length=32, default="cosine")
    latency_ms = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "chatbot_retrival_event"

class ChatbotRetrievedChunk(models.Model):
    seq_id = models.BigAutoField(primary_key=True)
    retriever = models.ForeignKey(ChatbotRetrivalEvent, on_delete=models.CASCADE, related_name="chunks")
    rank = models.IntegerField()
    doc_id = models.CharField(max_length=255)
    chunk_id = models.CharField(max_length=255)
    score = models.FloatField(null=True, blank=True)
    used_in_context = models.BooleanField(default=False)

    class Meta:
        db_table = "chatbot_retrieved_chunk"
