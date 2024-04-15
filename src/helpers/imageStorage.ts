/* eslint-disable prettier/prettier */
import * as path from 'path';
import { v4 as uuid4 } from 'uuid';
import { UnprocessableEntityException } from '@nestjs/common';
import * as fs from 'file-system';
import multer from 'multer';

type validFileExtensions = 'png' | 'jpg' | 'jpeg';
//type validFileExtensions = 'pdf';
type validMimesType = 'image/png' | 'image/jpg' | 'image/jpeg';
//type validMimesType = 'application/pdf';
//const validFileExtensions :validFileExtensions[]= ['png','jpg','jpeg'];
const validFileExtensions: validFileExtensions[] = ['jpg'];
const validMimesType: validMimesType[] = [
  'image/png',
  'image/jpg',
  'image/jpeg',
];
//const validMimesType :validMimesType[]= ['application/pdf'];

export enum MYDRIVE {
  ROOT = './uploads',
  PRODUCT = './uploads/products',
}

export const storageproducts = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    cb(null, MYDRIVE.PRODUCT);
  },
  filename: (req: any, file: any, callback: any) => {
    const fileExtention: string = path.extname(file.originalname);
    const filename: string = uuid4() + fileExtention;
    callback(null, filename);
  },
});





export const limitsParams = {
  //fieldNameSize:30,
  fileSize: 2048 * 2048,
  files: 1,
};

export const imageFileFilter = (req, file, callback) => {
  //var ext = path.extname(file.originalname);
  const allowedMimeTypes: validMimesType[] = validMimesType;
  allowedMimeTypes.includes(file.mimetype);
  if (!allowedMimeTypes.includes(file.mimetype)) {
    callback(
      new UnprocessableEntityException(
        'File extention not acceptable: ' + file.mimetype,
      ),
      false,
    );
    return false;
  }
  callback(null, true);
};

// function to encode file data to base64 encoded string
export const base64_encode = (file) => {
  // read binary data
  const bitmap = fs.readFileSync(file);
  // convert binary data to base64 encoded string
  return new Buffer(bitmap).toString('base64');
};

export const removeFile = (fullPathFile: any) => {
  try {
    fs.unlinkSync(fullPathFile);
  } catch (err) {
    console.log(err);
  }
};
