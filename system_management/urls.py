from unicodedata import name
from django.urls import path
from system_management import views

urlpatterns = [

    path(
        'check_file_exists',
        views.check_file_exists,
        name="check_file_exists"
    ),


]
