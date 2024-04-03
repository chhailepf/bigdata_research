$(document).on('click', '#upload', async function () {
    var csv_input = $('#csv_input').prop('files')[0];
    var file_name = 'file_name_index_1x10gbedge.csv';
    AWS.config.update({
        region: IDENTITY_POOL_REGION,
        credentials: new AWS.CognitoIdentityCredentials({
            IdentityPoolId: IDENTITY_POOL_ID, // replace with your actual Identity Pool ID
        })
    });
 
    var bucket_name = BUCKET_NAME;
 
    var object_key = `${OBJECT_KEY}/${file_name}`;
 
    var s3 = new AWS.S3({ region: BUCKET_REGION });
 
    try {
        await upload_file_to_s3(csv_input, s3, bucket_name, object_key);
    } catch (error) {
        console.error("Error uploading file:", error);
    }
});
 
async function initialMultipartUpload(bucketName, objectKey, s3) {
    try {
        // Initialize the multipart upload
        var params = {
            Bucket: bucketName,
            Key: objectKey,
        };
 
        var result = await s3.createMultipartUpload(params).promise();
        return result.UploadId;
    } catch (error) {
        console.error('Error initiating multipart upload:', error);
        throw error;
    }
}
 
async function upload_file_to_s3(file, s3, bucket_name, object_key) {
    var chunk_size = 5 * 1024 * 1024;
    var upload_id;
 
    try {
        var init_response = await initialMultipartUpload(bucket_name, object_key, s3);
        upload_id = init_response;
 
        var start = 0;
        var part_number = 1;
        var parts = [];
 
        console.log("file size", file.size);
 
        var uploadPromises = []; // Array to store promises for chunk uploads
        var counter = 0
        while (start < file.size) {
            var end = Math.min(start + chunk_size, file.size);
            var chunk_data = file.slice(start, end);
       
            var params = {
                Bucket: bucket_name,
                Key: object_key,
                PartNumber: part_number,
                UploadId: upload_id,
                Body: chunk_data
            };
       
            // Create a custom object with both partNumber and the promise:
            var uploadObject = {
                partNumber: part_number,
                promise: s3.uploadPart(params).promise()
            };
       
            // Push the custom object into the array:
            uploadPromises.push(uploadObject);
       
            start += chunk_size;
            part_number++;
            console.log("uploadPromises",uploadPromises)
            console.log("***start****")
            console.log(start)
 
            console.log("***end****")
            console.log(end)
 
            console.log("***counter****")
            console.log(part_number)
            // After each chunk, process results immediately:
            if (uploadPromises.length >= 10) {
                var results = await Promise.all(uploadPromises.map(obj => obj.promise));
       
                // Use a loop to correctly associate ETags and PartNumbers:
                for (let i = 0; i < results.length; i++) {
                    parts.push({ ETag: results[i].ETag, PartNumber: uploadPromises[i].partNumber });
                    console.log("etags",results[i].ETag)
                    console.log("partNumber",uploadPromises[i].partNumber)
                }
       
                uploadPromises = []; // Clear array for next batch of uploads
            }
        }
       
        // Check if remaining uploads need processing:
        if (uploadPromises.length > 0) {
            var remainingResults = await Promise.all(uploadPromises.map(obj => obj.promise));
            for (let i = 0; i < remainingResults.length; i++) {
                parts.push({ ETag: remainingResults[i].ETag, PartNumber: uploadPromises[i].partNumber });
            }
        }
        // Complete the multipart upload
        var completeParams = {
            Bucket: bucket_name,
            Key: object_key,
            UploadId: upload_id,
            MultipartUpload: {
                Parts: parts
            }
        };
 
        await s3.completeMultipartUpload(completeParams).promise();
 
        Swal.fire({
            icon: 'success',
            html: `Uploaded`,
            allowOutsideClick: false,
            showConfirmButton: false,
        });
    } catch (error) {
        console.error("Error uploading file:", error);
    }
}

// // Get the device memory in GB
// const deviceMemoryInGB = navigator.deviceMemory / 1024 / 1024;
 
// // Set chunk size based on available memory
// const chunkSizeMultiplier = deviceMemoryInGB >= 4 ? 16 : (deviceMemoryInGB >= 2 ? 8 : 4);
// const chunk_size = chunkSizeMultiplier * 1024 * 1024; // Set chunk size in bytes