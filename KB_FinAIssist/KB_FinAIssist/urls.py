"""
URL configuration for KB_FinAIssist project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.contrib import admin
from django.urls import path, include
from django.views.generic import RedirectView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("KB_FinAIssist/", include("f_user.urls")),
    path("todo/", include("f_todo.urls")),
    path("calendar/", include("f_calendar.urls")),
    path("chatbot/", include("f_chatbot.urls")),
    path("customer/", include("f_customer.urls")),
    path("document/", include("f_document.urls")),   
    path("common/", include("f_common.urls")), 
    path("loan/", include("f_loan.urls")), 
    path("", RedirectView.as_view(url="/KB_FinAIssist/"), name="main"),
]