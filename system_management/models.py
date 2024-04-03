from django.db import models


class FIleUpload(models.Model):
    file_name = models.TextField()
    upload_id = models.TextField()
    file_size = models.CharField(max_length=250)
    upload_completed = models.BooleanField(default=False)