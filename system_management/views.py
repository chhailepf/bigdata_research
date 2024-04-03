from django.shortcuts import render
from decouple import config
from system_management.models import *
from django.http import HttpResponse, JsonResponse


# Create your views here.
def home(request):

    IDENTITY_POOL_REGION = config("IDENTITY_POOL_REGION")
    IDENTITY_POOL_ID = config("IDENTITY_POOL_ID")
    OBJECT_KEY = config("OBJECT_KEY")
    BUCKET_NAME = config("BUCKET_NAME")
    BUCKET_REGION = config("BUCKET_REGION")

    context = {
        "IDENTITY_POOL_REGION":IDENTITY_POOL_REGION,
        "IDENTITY_POOL_ID":IDENTITY_POOL_ID,
        "OBJECT_KEY":OBJECT_KEY,
        "BUCKET_NAME":BUCKET_NAME,
        "BUCKET_REGION":BUCKET_REGION,
    }
    
    return render(request, "system_management\home.html",context=context)


def check_file_exists(request):

    if request.method == "GET":

        file_name = request.POST.get("file_name")
        file_size = request.POST.get("file_size")

        file_exists = FIleUpload.objects.filter(
            file_name = file_name,
            file_size = file_size,
        ).exists()

        
        print("*"*10)
        print(file_exists)
        print("*"*10)

        request_body = {
            "data" : {
                "file_exists" : file_exists
            }
        }

        return JsonResponse(request_body,status=200)
        
        