# Create your views here.
from django.shortcuts import render

# Create your views here.
def document(request) : 
    return render(request, 'document/document.html')