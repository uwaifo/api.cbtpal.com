import { Storage } from "@google-cloud/storage";
import path from "path";
import { unlink, createWriteStream } from "fs";
import shortid from "shortid";

let fileURL = "";
var bucket = "";

const gcp = new Storage({
  keyFilename: path.join(__dirname, "../../motionwares-hire-9bb03694d0cc.json"),
  projectId: "motionwares-hire",
});

// gcp.getBuckets().then(x => console.log(x));

//Uploading file to GCP
export function uploadFile(bucketName, filename) {
  gcp
    .bucket(bucketName)
    .upload(filename, {
      gzip: true,
      public: true,
    })
    .then(() => {
      //Deleting file on local storage
      unlink(filename, (err) => {
        if (err) {
          throw err;
        }
      });
    })
    .catch((err) => {
      console.error(`ERR: ${err}`);
    });
}

//Handle Storage of Upload
export const storeUpload = ({ createReadStream, filename }) => {
  const id = shortid.generate();
  const path = `${id}-${filename}`;
  return new Promise((resolve, reject) =>
    createReadStream()
      .pipe(createWriteStream(path))
      .on("error", (error) => reject(error))
      .on("finish", async () => {
        await uploadFile(bucket, path);
        fileURL = `http://storage.googleapis.com/${bucket}/${path}`;
        resolve({ fileURL, path });
      })
  );
};

//Processing file upload
export const processUpload = async (upload, bk) => {
  bucket = bk;
  const { createReadStream, filename, mimetype, encoding } = await upload;
  const { fileURL, path } = await storeUpload({ createReadStream, filename });
  let url = fileURL;
  return { url, mimetype, encoding, path };
};
