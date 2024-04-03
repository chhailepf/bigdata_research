    // $(document).on('click','#upload',function(){
    //         var csv_input = $('#csv_input').prop('files')[0]; 
    //         var file_name = 'file_name_velly.csv';
    //         AWS.config.update({
    //             region: IDENTITY_POOL_REGION,
    //             credentials: new AWS.CognitoIdentityCredentials({
    //                 IdentityPoolId: IDENTITY_POOL_ID , // replace with your actual Identity Pool ID
    //             })
    //         });

    //         var bucket_name = BUCKET_NAME;
            
    //         var object_key = `${OBJECT_KEY}/${file_name}`;
        
    //         var s3 = new AWS.S3({ region: BUCKET_REGION });
        

    //         upload_file_to_s3(
    //             file = csv_input,
    //             s3 = s3,
    //             bucket_name = bucket_name,
    //             object_key = object_key,
    //         )
            
    //         })
        
    //         async function initialMultipartUpload(bucketName, objectKey, s3) {
    //             try {
    //                 // Initialize the multipart upload
    //                 const params = {
    //                     Bucket: bucketName,
    //                     Key: objectKey,
    //                 };
            
    //                 const result = await s3.createMultipartUpload(params).promise();
    //                 return result.UploadId;
    //             } catch (error) {
    //                 console.error('Error initiating multipart upload:', error);
    //                 throw error;
    //             }
    //         }

    // async function upload_file_to_s3(file,s3,bucket_name,object_key){

    //     var chunk_size = 5 * 1024 * 1024;
    //     // var chunk_size = 50 * 1024 * 1024;
    //     var upload_id;

    //     try{

    //         const init_response = await initialMultipartUpload(
    //             bucket_name = bucket_name,
    //             object_key = object_key,
    //             s3 = s3,
    //         );

    //         upload_id = init_response

    //         var start = 0;
    //         var part_number = 1;
    //         var parts = [];

    //         console.log("file size")
    //         console.log(file.size)

    //         // alert(upload_id)
    //         while (start < file.size) {

    //             var end = Math.min(start + chunk_size, file.size);
    //             var chunk_data = file.slice(start, end);

    //             const params = {
    //                 Bucket: bucket_name,
    //                 Key: object_key,
    //                 PartNumber: part_number,
    //                 UploadId: upload_id,
    //                 Body: chunk_data
    //             };

    //             const { ETag } = await s3.uploadPart(params).promise();

    //             parts.push({ ETag,"PartNumber": part_number,});

    //             start += chunk_size; // Increment start for the next iteration
    //             part_number = part_number + 1; // Increment part_number for the next iteration

    //             console.log("***start****")
    //             console.log(start)

    //             console.log("***end****")
    //             console.log(end)

    //             console.log("***counter****")
    //             console.log(part_number)

    //         }

    //         // Complete file upload starting

    //         var params = {
    //             Bucket: bucket_name,
    //             Key: object_key,
    //             UploadId: upload_id,
    //             MultipartUpload: {
    //                 Parts: parts
    //             }
    //         };

    //         await s3.completeMultipartUpload(params).promise();

    //         Swal.fire({
    //             icon:'success',
    //             html: `Uploaded`,
    //             allowOutsideClick: false,
    //             showConfirmButton:false,
    //         });

    //     }catch (error) {

    //         console.error("Error uploading file:", error);
    //     }

    // }


$(document).on('click', '#upload', async function() {

    var csvInput = $('#csv_input').prop('files')[0];

    var fileName = csvInput.fileName;
    var file_size = csvInput.fileName;
    
    check_if_file_exists(
        file_name=fileName,
        file_size=file_size,
    )

    
    
    try {
        AWS.config.update({
            region: IDENTITY_POOL_REGION,
            credentials: new AWS.CognitoIdentityCredentials({
                IdentityPoolId: IDENTITY_POOL_ID, // replace with your actual Identity Pool ID
            })
        });

        var bucketName = BUCKET_NAME;
        var objectKey = `${OBJECT_KEY}/${fileName}`;
        var s3 = new AWS.S3({ region: BUCKET_REGION });
        await uploadFileToS3(csvInput, s3, bucketName, objectKey);
    } catch (error) {
        console.error("Error:", error);
    }
});


async function initialMultipartUpload(bucketName, objectKey, s3) {
    try {
        const params = {
            Bucket: bucketName,
            Key: objectKey,
        };
        const result = await s3.createMultipartUpload(params).promise();
        return result.UploadId;
    } catch (error) {
        console.error('Error initiating multipart upload:', error);
        throw error;
    }
}


async function uploadFileToS3(file, s3, bucketName, objectKey) {
    const chunkSize = 25 * 1024 * 1024;
    try {
        const uploadId = await initialMultipartUpload(bucketName, objectKey, s3);
        let start = 0;
        let partNumber = 1;
        const parts = [];

        while (start < file.size) {
            const end = Math.min(start + chunkSize, file.size);
            const chunkData = file.slice(start, end);

            const params = {
                Bucket: bucketName,
                Key: objectKey,
                PartNumber: partNumber,
                UploadId: uploadId,
                Body: chunkData
            };

            const { ETag } = await s3.uploadPart(params).promise();
            parts.push({ ETag, "PartNumber": partNumber });
            start += chunkSize;
            partNumber++;
        }

        const completeParams = {
            Bucket: bucketName,
            Key: objectKey,
            UploadId: uploadId,
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
        throw error;
    }
}

function check_if_file_exists(file_name,file_size){

    var form_data = new FormData();

    form_data.append("file_name",file_name);
    form_data.append("file_size",file_size);

    $.ajax({
        url: CHECK_FILE_EXISTS_URL,
        type: 'GET',
        data: form_data,
        headers: {
            'X-CSRFToken': CSRF_TOKEN
        },
        processData: false,
        contentType: false,

        success: function (response) {
            
            file_status = `${response.data.file_exists}`;

            if( file_status == "true" ){

                Swal.fire({
                    icon: 'info',
                    title: 'Caution',
                    text: 'The file you are uploading already exists in the platform but was not completed, do you wish to continue?',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    
                });

            }
            
            else if( file_status == "false" ){

                
                Swal.fire({
                    icon: 'info',
                    title: 'Caution',
                    text: 'The file you are uploading already exists in the platform but was not completed, do you wish to continue?',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    
                });
                
            }
            
        },

        error: function (data) {
            Swal.fire({
                title: 'Something went wrong!',
                icon: 'error',
                timer: 3000,
                button: "OK",
            });
        }
    });

}
    
// $(document).on('click', '#upload', async function () {
//   var csv_input = $('#csv_input').prop('files')[0];
//   var file_name = 'file_name_sean.csv';
//   AWS.config.update({
//       region: IDENTITY_POOL_REGION,
//       credentials: new AWS.CognitoIdentityCredentials({
//           IdentityPoolId: IDENTITY_POOL_ID, // replace with your actual Identity Pool ID
//       })
//   });

//   var bucket_name = BUCKET_NAME;

//   var object_key = `${OBJECT_KEY}/${file_name}`;

//   var s3 = new AWS.S3({ region: BUCKET_REGION });

//   try {
//       await upload_file_to_s3(csv_input, s3, bucket_name, object_key);
//   } catch (error) {
//       console.error("Error uploading file:", error);
//   }
// });

// async function initialMultipartUpload(bucketName, objectKey, s3) {
//   try {
//       // Initialize the multipart upload
//       const params = {
//           Bucket: bucketName,
//           Key: objectKey,
//       };

//       const result = await s3.createMultipartUpload(params).promise();
//       return result.UploadId;
//   } catch (error) {
//       console.error('Error initiating multipart upload:', error);
//       throw error;
//   }
// }

// async function upload_file_to_s3(file, s3, bucket_name, object_key) {
//   var chunk_size = 5 * 1024 * 1024;
//   var upload_id;

//   try {
//       const init_response = await initialMultipartUpload(bucket_name, object_key, s3);
//       upload_id = init_response;

//       var start = 0;
//       var part_number = 1;
//       var parts = [];

//       console.log("file size", file.size);

//       const uploadPromises = []; // Array to store promises for chunk uploads

//       while (start < file.size) {
//           var end = Math.min(start + chunk_size, file.size);
//           var chunk_data = file.slice(start, end);

//           const params = {
//               Bucket: bucket_name,
//               Key: object_key,
//               PartNumber: part_number,
//               UploadId: upload_id,
//               Body: chunk_data
//           };

//           // Push the upload promise into the array
//           uploadPromises.push(s3.uploadPart(params).promise());

//           start += chunk_size;
//           part_number++;

//           console.log("***start****", start);
//           console.log("***end****", end);
//           console.log("***counter****", part_number);
//       }

//       // Execute all upload promises concurrently
//       const results = await Promise.all(uploadPromises);

//       // Populate the parts array with results
//       results.forEach(({ ETag }, index) => {
//           parts.push({ ETag, "PartNumber": index + 1 });
//       });

//       // Complete the multipart upload
//       const completeParams = {
//           Bucket: bucket_name,
//           Key: object_key,
//           UploadId: upload_id,
//           MultipartUpload: {
//               Parts: parts
//           }
//       };

//       await s3.completeMultipartUpload(completeParams).promise();

//       Swal.fire({
//           icon: 'success',
//           html: `Uploaded`,
//           allowOutsideClick: false,
//           showConfirmButton: false,
//       });
//   } catch (error) {
//       console.error("Error uploading file:", error);
//   }
// }

/// above is working 

///below is working sean 
// $(document).on('click', '#upload', async function () {
//   var csv_input = $('#csv_input').prop('files')[0];
//   var file_name = 'file_name_sean.csv';
//   AWS.config.update({
//     region: IDENTITY_POOL_REGION,
//     credentials: new AWS.CognitoIdentityCredentials({
//       IdentityPoolId: IDENTITY_POOL_ID, // Replace with your Identity Pool ID
//     })
//   });

//   var bucket_name = BUCKET_NAME;
//   var object_key = `${OBJECT_KEY}/${file_name}`;
//   var s3 = new AWS.S3({ region: BUCKET_REGION });

//   try {
//     await uploadFileToS3(csv_input, s3, bucket_name, object_key, 10);
//   } catch (error) {
//     console.error("Error uploading file:", error);
//   }
// });

// async function uploadFileToS3(file, s3, bucketName, objectKey, chunkSize = 5 * 1024 * 1024) {
//   var uploadId;

//   try {
//     const initResponse = await initialMultipartUpload(bucketName, objectKey, s3);
//     uploadId = initResponse;
//   } catch (error) {
//     console.error('Error initiating multipart upload:', error);
//     throw error;
//   }

//   var start = 0;
//   var partNumber = 1;
//   var parts = [];

//   while (start < file.size) {
//     const chunkPromises = []; // Array to store promises for a batch of chunks
//     const endOfBatch = Math.min(start + chunkSize * 10, file.size); // Max 10 chunks per batch

//     while (start < endOfBatch && start < file.size) {
//       const end = Math.min(start + chunkSize, file.size);
//       const chunkData = file.slice(start, end);
//       console.log('chunkData', chunkData);
//       const uploadParams = {
//         Bucket: bucketName,
//         Key: objectKey,
//         PartNumber: partNumber,
//         UploadId: uploadId,
//         Body: chunkData
//       };

//       chunkPromises.push(s3.uploadPart(uploadParams).promise()); // Queue the chunk upload

//       start += chunkSize;
//       partNumber++;
//       console.log('start', start);
//       console.log('partNumber', partNumber);
//       console.log('end', end);
//     }

//     // Wait for all chunks in the batch to finish uploading before proceeding
//     await Promise.all(chunkPromises);

//     // Extract ETags from completed chunk uploads
//     chunkPromises.forEach(({ ETag }, index) => {
//       parts.push({ ETag, PartNumber: index + 1 });
//     });
//   }

//   // Complete the multipart upload when all chunks are uploaded
//   const completeParams = {
//     Bucket: bucketName,
//     Key: objectKey,
//     UploadId: uploadId,
//     MultipartUpload: {
//       Parts: parts
//     }
//   };

//   await s3.completeMultipartUpload(completeParams).promise();

//   Swal.fire({
//     icon: 'success',
//     html: `Uploaded`,
//     allowOutsideClick: false,
//     showConfirmButton: false
//   });
// }

// async function initialMultipartUpload(bucketName, objectKey, s3) {
//   try {
//     const params = {
//       Bucket: bucketName,
//       Key: objectKey
//     };

//     const result = await s3.createMultipartUpload(params).promise();
//     return result.UploadId;
//   } catch (error) {
//     console.error('Error initiating multipart upload:', error);
//     throw error;
//   }
// }


///below is mayita 
// $(document).on('click', '#upload', async function () {
//   var csv_input = $('#csv_input').prop('files')[0];
//   var file_name = 'file_name_index_221.csv';
//   AWS.config.update({
//       region: IDENTITY_POOL_REGION,
//       credentials: new AWS.CognitoIdentityCredentials({
//           IdentityPoolId: IDENTITY_POOL_ID, // replace with your actual Identity Pool ID
//       })
//   });

//   var bucket_name = BUCKET_NAME;

//   var object_key = `${OBJECT_KEY}/${file_name}`;

//   var s3 = new AWS.S3({ region: BUCKET_REGION });

//   try {
//       await upload_file_to_s3(csv_input, s3, bucket_name, object_key);
//   } catch (error) {
//       console.error("Error uploading file:", error);
//   }
// });

// async function initialMultipartUpload(bucketName, objectKey, s3) {
//   try {
//       // Initialize the multipart upload
//       const params = {
//           Bucket: bucketName,
//           Key: objectKey,
//       };

//       var result = await s3.createMultipartUpload(params).promise();
//       return result.UploadId;
//   } catch (error) {
//       console.error('Error initiating multipart upload:', error);
//       throw error;
//   }
// }

// async function upload_file_to_s3(file, s3, bucket_name, object_key) {
//   var chunk_size = 100 * 1024 * 1024;
//   var upload_id;

//   try {
//       var init_response = await initialMultipartUpload(bucket_name, object_key, s3);
//       upload_id = init_response;

//       var start = 0;
//       var part_number = 1;
//       var parts = [];

//       console.log("file size", file.size);

//       var uploadPromises = []; // Array to store promises for chunk uploads
//       var counter = 0
//       while (start < file.size) {
//           var end = Math.min(start + chunk_size, file.size);
//           var chunk_data = file.slice(start, end);

//           var params = {
//               Bucket: bucket_name,
//               Key: object_key,
//               PartNumber: part_number,
//               UploadId: upload_id,
//               Body: chunk_data
//           };

//           // Push the upload promise into the array
//           uploadPromises.push(s3.uploadPart(params).promise());
//           counter+=1;

//           if(counter == 5){
//               var results = await Promise.all(uploadPromises);
//               results.forEach(({ ETag }, part_number) => {
//                   console.log('PartNumber' ,part_number)
//                   parts.push({ ETag, "PartNumber": part_number });
//               });
//               counter = 0
//               uploadPromises = []
//           }
//           start += chunk_size;
//           part_number++;

//           console.log("***start****", start);
//           console.log("***end****", end);
//           console.log("***counter****", part_number);
//       }
     

//       // Execute all upload promises concurrently
//       var results = await Promise.all(uploadPromises);

//       // Populate the parts array with results
//       results.forEach(({ ETag }, index) => {
//           console.log('PartNumber' ,index)
//           parts.push({ ETag, "PartNumber": index + 1 });
//       });

//       // Complete the multipart upload
//       const completeParams = {
//           Bucket: bucket_name,
//           Key: object_key,
//           UploadId: upload_id,
//           MultipartUpload: {
//               Parts: parts
//           }
//       };

//       await s3.completeMultipartUpload(completeParams).promise();

//       Swal.fire({
//           icon: 'success',
//           html: `Uploaded`,
//           allowOutsideClick: false,
//           showConfirmButton: false,
//       });
//   } catch (error) {
//       console.error("Error uploading file:", error);
//   }
// }