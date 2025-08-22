from django.urls import path
from . import views

urlpatterns = [
    path("", views.document, name="document"),
]
