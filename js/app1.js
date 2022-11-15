//import cv from "../node_modules/opencv-ts/src/opencv";

//const { default: cv } = require("opencv-ts");

function onRuntimeInitialized() {
  cv.then((e) => {
  //  console.log('ok');
    cv = e;
    let src = cv.imread("canvasInput0");
    let src1 = cv.imread("canvasInput1");
    
    const defaultvalue = {
      qcm_min_width_shape: 10,
      qcm_min_height_shape: 10,
      qcm_epsilon: 0.0145, // 0.03
      qcm_differences_avec_case_blanche: 0.22,
      linelength: 15,
      repairsize: 3,
      dilatesize: 3,
      morphsize: 3,
      drawcontoursizeh: 4,
      drawcontoursizev: 4,
      minCircle: 6,
      maxCircle: 20,
      numberofpointToMatch: 5,
      numberofgoodpointToMatch: 0,
      defaultAlignAlgowithMarker: true,
    };
//    let result = alignImage(src,src1,false,5,0)
let result = alignImageBasedOnCircle(src,src1,defaultvalue)

    cv.imshow("canvas_output0", result['imageAligned']); 
  //  cv.imshow("canvas_output1", result['imageCompareMatches']); 
  //  cv.imshow("canvas_output2", result['keypoints1']); 
  //  cv.imshow("canvas_output3", result['keypoints2']); 

 //   src.delete();
 //   src1.delete();
   
    
   

  });
}


function alignImageBasedOnCircle(
  imageA,
  imageB,
  preference
) {
  //im2 is the original reference image we are trying to align to
  //const imageA = new ImageData(new Uint8ClampedArray(image_Aba), widthA, heightA);
  //const imageB = new ImageData(new Uint8ClampedArray(image_Bba), widthB, heightB);

  let srcMat = imageA;
  let dst = new cv.Mat(); ///cv.Mat.zeros(srcMat.rows, srcMat.cols, cv.CV_8U);
  // let color = new cv.Scalar(255, 0, 0);
  // let displayMat = srcMat.clone();
  let circlesMat = new cv.Mat();
  cv.cvtColor(srcMat, srcMat, cv.COLOR_RGBA2GRAY);
  //  cv.HoughCircles(srcMat, circlesMat, cv.HOUGH_GRADIENT, 1, 45, 75, 40, 0, 0);
  let minCircle = (srcMat.cols * preference.minCircle) / 1000;
  let maxCircle = (srcMat.cols * preference.maxCircle) / 1000;

  cv.HoughCircles(srcMat, circlesMat, cv.HOUGH_GRADIENT, 1, 45, 75, 20, minCircle, maxCircle);
  let x1, y1, r1;
  let x2, y2, r2;
  let x3, y3, r3;
  let x4, y4, r4;
  if (circlesMat.cols > 0) {
    x1 = circlesMat.data32F[0];
    y1 = circlesMat.data32F[1];
    r1 = circlesMat.data32F[2];
    x2 = circlesMat.data32F[0];
    y2 = circlesMat.data32F[1];
    r2 = circlesMat.data32F[2];
    x3 = circlesMat.data32F[0];
    y3 = circlesMat.data32F[1];
    r3 = circlesMat.data32F[2];
    x4 = circlesMat.data32F[0];
    y4 = circlesMat.data32F[1];
    r4 = circlesMat.data32F[2];
  }

  const srcMWidth = srcMat.size().width;
  const srcMHeight = srcMat.size().height;
  if (circlesMat.cols > 0) {
    for (let i = 1; i < circlesMat.cols; i++) {
      let x = circlesMat.data32F[i * 3];
      let y = circlesMat.data32F[i * 3 + 1];
      let radius = circlesMat.data32F[i * 3 + 2];
      if (x * x + y * y <= x1 * x1 + y1 * y1) {
        x1 = x;
        y1 = y;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        r1 = radius;
      }
      if (x * x + y * y >= x4 * x4 + y4 * y4) {
        x4 = x;
        y4 = y;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        r4 = radius;
      }
      if ((srcMWidth - x) * (srcMWidth - x) + y * y <= (srcMWidth - x2) * (srcMWidth - x2) + y2 * y2) {
        x2 = x;
        y2 = y;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        r2 = radius;
      }
      if (x * x + (srcMHeight - y) * (srcMHeight - y) <= x3 * x3 + (srcMHeight - y3) * (srcMHeight - y3)) {
        x3 = x;
        y3 = y;
        r3 = radius;
      }
    }
  }

  let srcMat2 = imageB;
  let srcMat1 = new cv.Mat();
  let circlesMat1 = new cv.Mat();
  cv.cvtColor(srcMat2, srcMat1, cv.COLOR_RGBA2GRAY);
  const srcMWidth1 = srcMat1.size().width;
  const srcMHeight1 = srcMat1.size().height;
  //  cv.HoughCircles(srcMat, circlesMat, cv.HOUGH_GRADIENT, 1, 45, 75, 40, 0, 0);
  cv.HoughCircles(srcMat1, circlesMat1, cv.HOUGH_GRADIENT, 1, 45, 75, 20, r3 - 3, r3 + 3);
  let goodpointsx = [];
  let goodpointsy = [];
  const seuil = (((4 * r3 * r3) - (3.14159 * r3 * r3)) * 180) / 100;
  console.log(seuil)
  for (let i = 0; i < circlesMat1.cols; i++) {
    let x = circlesMat1.data32F[i * 3];
    let y = circlesMat1.data32F[i * 3 + 1];

    const xx1 = x - r3;
    const yy1 = y - r3;
    let width1 = 2 * r3;
    let height1 = 2 * r3;
    if (xx1 + width1 > srcMWidth1) {
      width1 = srcMWidth1 - xx1;
    }
    if (yy1 + height1 > srcMHeight1) {
      height1 = srcMHeight1 - yy1;
    }

    let rect1 = new cv.Rect(x - r3, y - r3, width1, height1);
    let dstrect1 = new cv.Mat();
    dstrect1 = this.roi(srcMat1, rect1, dstrect1);
    cv.threshold(dstrect1, dstrect1, 0, 255, cv.THRESH_OTSU + cv.THRESH_BINARY);
    console.log(cv.countNonZero(dstrect1))
    if (cv.countNonZero(dstrect1) < seuil) {
      goodpointsx.push(x);
      goodpointsy.push(y);
    }
    dstrect1.delete();
  }

  let x5, y5;
  let x6, y6;
  let x7, y7;
  let x8, y8;
  if (goodpointsx.length > 0) {
    x5 = goodpointsx[0];
    y5 = goodpointsy[0];
    x6 = goodpointsx[0];
    y6 = goodpointsy[0];
    x7 = goodpointsx[0];
    y7 = goodpointsy[0];
    x8 = goodpointsx[0];
    y8 = goodpointsy[0];
  }

  if (goodpointsx.length > 1) {
    for (let i = 0; i < goodpointsx.length; i++) {
      let x = goodpointsx[i];
      let y = goodpointsy[i];
      if (x * x + y * y <= x5 * x5 + y5 * y5) {
        x5 = x;
        y5 = y;
      }
      if (x * x + y * y >= (x8 * x8) + (y8 * y8)) {
        x8 = x;
        y8 = y;
      }
      if ((srcMWidth1 - x) * (srcMWidth1 - x) + y * y <= (srcMWidth1 - x6) * (srcMWidth1 - x6) + y6 * y6) {
        x6 = x;
        y6 = y;
      }
      if (x * x + (srcMHeight1 - y) * (srcMHeight1 - y) <= x7 * x7 + (srcMHeight1 - y7) * (srcMHeight1 - y7)) {
        x7 = x;
        y7 = y;
      }
    }
  }
  console.log([x1, y1, x2, y2, x3, y3, x4, y4])
  console.log([x5, y5, x6, y6, x7, y7, x8, y8])
  if (goodpointsx.length >= 4) {
    let srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [x1, y1, x2, y2, x3, y3, x4, y4]);
    let dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [x5, y5, x6, y6, x7, y7, x8, y8]);
    //  let srcTri = cv.matFromArray(3, 1, cv.CV_32FC2, [x4, y4, x2, y2, x3, y3]);
    //  let dstTri = cv.matFromArray(3, 1, cv.CV_32FC2, [x8, y8, x6, y6, x7, y7]);
    /*  let M = cv.getPerspectiveTransform(dstTri,srcTri);
//  let M = cv.getAffineTransform(srcTri, dstTri);
//  console.log(M)
  let dsize = new cv.Size(srcMat1.rows, srcMat1.cols);

  cv.warpPerspective(srcMat1, dst, M, dsize, cv.BORDER_CONSTANT , cv.BORDER_REPLICATE, new cv.Scalar());*/

    //59    Find homography
    //60    h = findHomography( points1, points2, RANSAC );
    //    let h = cv.findHomography(dstTri, srcTri, cv.RANSAC);
    //    let dsize = new cv.Size(srcMat.cols, srcMat.rows);

    /*   if (h.empty()) {
      console.log('homography matrix empty!');
      return;
    }*/
    //    let mat1 = cv.matFromArray(4, 1, cv.CV_32FC2, points1);
    //   let mat2 = cv.matFromArray(4, 1, cv.CV_32FC2,points2);
    let M = cv.getPerspectiveTransform(dstTri, srcTri);
    let dsize = new cv.Size(srcMat.cols, srcMat.rows);
    for (let i = 0; i < srcTri.rows; ++i) {
      //      let x = srcTri.data32F[i * 2];
      //      let y = srcTri.data32F[i * 2 + 1];
      const xx = dstTri.data32F[i * 2];
      const yy = dstTri.data32F[i * 2 + 1];
      let radius = 15;
      let center = new cv.Point(xx, yy);
      //      cv.circle(srcMat, center, radius, [0, 0, 255, 255], 1);
      cv.circle(srcMat2, center, radius, [0, 0, 255, 255], 1);
    }

    cv.warpPerspective(srcMat2, dst, M, dsize, cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());

    let dst1 = dst.clone();
    let result = {} ;
    result['imageAligned'] = dst1;
    result['imageAlignedWidth'] = dst1.size().width;
    result['imageAlignedHeight'] = dst1.size().height;

    srcMat.delete();
    dst.delete();
    circlesMat.delete();
    srcMat1.delete();
    srcMat2.delete();
    circlesMat1.delete();
    srcTri.delete();
    dstTri.delete();
   // dst1.delete();

    return result;
  } else {
    srcMat.delete();
    dst.delete();
    circlesMat.delete();
    srcMat1.delete();
    srcMat2.delete();
    circlesMat1.delete();
    return this.alignImage(
      image_Aba,
      image_Bba,
      false,
      preference.numberofpointToMatch,
      preference.numberofgoodpointToMatch
    );
  }
}

function alignImage(im2, im1,allimage,numberofpointToMatch,numberofgoodpointToMatch) {
  //im2 is the original reference image we are trying to align to
  //let im2 = cv.matFromImageData(image_A);
  //let im1 = cv.matFromImageData(image_B);
  let im1Gray = new cv.Mat();
  let im2Gray = new cv.Mat();
  cv.cvtColor(im1, im1Gray, cv.COLOR_BGRA2GRAY);
  cv.cvtColor(im2, im2Gray, cv.COLOR_BGRA2GRAY);
  const squareSizeorigin = 200;
  let points1 = [];
  let points2 = [];
  let result = {} ;

  if (!allimage){
  let res = false
  let squareSize =  squareSizeorigin;
  while (!res && squareSize <   im1Gray.size().width &&  squareSize < im1Gray.size().height){
    let zone1 = new cv.Rect(0, 0, squareSize, squareSize);
    res = matchSmallImage(im1Gray,im2Gray, points1, points2, zone1,1,numberofpointToMatch,numberofgoodpointToMatch)
    if(!res){
      squareSize = squareSize +50;
    }
  }
  
  res = false
  squareSize =  squareSizeorigin;
  while (!res && squareSize <   im1Gray.size().width &&  squareSize < im1Gray.size().height){
    let zone2 = new cv.Rect( im1Gray.size().width -squareSize, 0,  im1Gray.size().width, squareSize);
    res =   matchSmallImage(im1Gray,im2Gray, points1, points2, zone2,2,numberofpointToMatch,numberofgoodpointToMatch)
    if(!res){
      squareSize = squareSize +50;
    }
  }

  res = false
  squareSize =  squareSizeorigin;
  while (!res && squareSize <   im1Gray.size().width &&  squareSize < im1Gray.size().height){
    let zone3 = new cv.Rect(0, im1Gray.size().height -squareSize, squareSize, im1Gray.size().height);
    res = matchSmallImage(im1Gray,im2Gray, points1, points2, zone3,3,numberofpointToMatch,numberofgoodpointToMatch)

    if(!res){
      squareSize = squareSize +50;
    }
  }

  res = false
  squareSize =  squareSizeorigin;
  while (!res && squareSize <   im1Gray.size().width &&  squareSize < im1Gray.size().height){
    let zone4 = new cv.Rect(im1Gray.size().width -squareSize, im1Gray.size().height -squareSize,  im1Gray.size().width, im1Gray.size().height);    
    res =  matchSmallImage(im1Gray,im2Gray, points1, points2, zone4,4,numberofpointToMatch,numberofgoodpointToMatch)
    if(!res){
      squareSize = squareSize +50;
    }
  }

/*

  res = false
  squareSize =  squareSizeorigin;
  while (!res && squareSize <   im1Gray.size().width &&  squareSize < im1Gray.size().height){
    let zone5 = new cv.Rect((im1Gray.size().width -squareSize)/2, (im1Gray.size().height -squareSize)/2, squareSize , squareSize,numberofpointToMatch,numberofgoodpointToMatch);    
    res =  matchSmallImage(im1Gray,im2Gray, points1, points2, zone5,5)
    if(!res){
      squareSize = squareSize +50;
    }
  }*/
  
  }else {
    let zone6 = new cv.Rect(0, 0, im1Gray.size().width, im1Gray.size().height);    
    matchSmallImage(im1Gray,im2Gray, points1, points2, zone6,1,numberofpointToMatch,numberofgoodpointToMatch)
  
  }



    console.log('points1:', points1, 'points2:', points2);

//  let mat1 = new cv.Mat(points1.length, 1, cv.CV_32FC2);
 // mat1.data32F.set(points1);
 // let mat2 = new cv.Mat(points2.length, 1, cv.CV_32FC2);
 // mat2.data32F.set(points2);

 let mat1 = cv.matFromArray(4, 1, cv.CV_32FC2, points1);
 let mat2 = cv.matFromArray(4, 1, cv.CV_32FC2,points2);

  // let h = cv.findHomography(mat1, mat2, cv.RANSAC);
  let M = cv.getPerspectiveTransform(mat1, mat2);


/*  if (h.empty()) {
    console.log('homography matrix empty!');
    return;
  } */

  let image_B_final_result = new cv.Mat();
//  cv.warpPerspective(im1, image_B_final_result, h, im2.size());

cv.warpPerspective(im1, image_B_final_result, M, im2.size(), cv.INTER_LINEAR, cv.BORDER_CONSTANT, new cv.Scalar());


//  result['imageAligned'] = imageDataFromMat(image_B_final_result);
result['imageAligned'] = image_B_final_result;
    
result['imageAlignedWidth'] = image_B_final_result.size().width;
  result['imageAlignedHeight'] = image_B_final_result.size().height;

  mat1.delete();
  mat2.delete();
 // im1.delete();
 // im2.delete();
  
  im1Gray.delete();
  im2Gray.delete();
  return result;
}


function matchSmallImage(im1Gray,im2Gray , points1,
  points2, zone1, i,numberofpointToMatch ,numberofgoodpointToMatch){

  let im1Graydst = new cv.Mat();
  im1Graydst = roi(im1Gray, zone1, im1Graydst);
  // cv.imshow("canvas_output2", im1Graydst); 

  let im2Graydst = new cv.Mat();
  im2Graydst = roi(im2Gray, zone1, im2Graydst);

 let keypoints1 = new cv.KeyPointVector();
 let keypoints2 = new cv.KeyPointVector();
 let descriptors1 = new cv.Mat();
 let descriptors2 = new cv.Mat();

 let orb = new cv.AKAZE();
 let tmp1 = new cv.Mat();
 let tmp2 = new cv.Mat();
 orb.detectAndCompute(im1Graydst, tmp1, keypoints1, descriptors1);
 orb.detectAndCompute(im2Graydst, tmp2, keypoints2, descriptors2);


 let good_matches = new cv.DMatchVector();

 let bf = new cv.BFMatcher();
 let matches = new cv.DMatchVectorVector();
 bf.knnMatch(descriptors1, descriptors2, matches, 2);

 //  let counter = 0;
 for (let i = 0; i < matches.size(); ++i) {
   let match = matches.get(i);
   let dMatch1 = match.get(0);
   let dMatch2 = match.get(1);
   let knnDistance_option = '0.7';
   if (dMatch1 !== undefined && dMatch2 !== undefined &&  dMatch1.distance <= dMatch2.distance * parseFloat(knnDistance_option)) {
    good_matches.push_back(dMatch1);
   }
 }



 

 // let imMatches = new cv.Mat();
 // let color = new cv.Scalar(0, 255, 0, 255);
 // cv.drawMatches(im1, keypoints1, im2, keypoints2, good_matches, imMatches, color);
// console.log("good matches "  +  good_matches.size())
let points1tmp = [];
let points2tmp = [];
for (let i = 0; i < good_matches.size(); i++) {
  points1tmp.push(keypoints1.get(good_matches.get(i).queryIdx).pt.x+ zone1.x);
  points1tmp.push(keypoints1.get(good_matches.get(i).queryIdx).pt.y+ zone1.y);
  points2tmp.push(keypoints2.get(good_matches.get(i).trainIdx).pt.x+ zone1.x);
  points2tmp.push(keypoints2.get(good_matches.get(i).trainIdx).pt.y+ zone1.y);
}
let goodmatchtokeep = 0;
let distances = [];

if(good_matches.size() ===0){
  orb.delete();
  keypoints1.delete();
  keypoints2.delete();
  descriptors1.delete();
  descriptors2.delete();
  tmp1.delete();
  tmp2.delete();
  // im1Graydst.delete();
  im2Graydst.delete();
  matches.delete();
  good_matches.delete();
  bf.delete(); 

  return false;
}

for (let i = 0; i < good_matches.size(); i++) {
  let distancesquare  =((points1tmp[2*i] - points2tmp[2*i]) * (points1tmp[2*i] - points2tmp[2*i])) +    
  ((points1tmp[2*i+1] - points2tmp[2*i+1]) * (points1tmp[2*i+1] - points2tmp[2*i+1]))  
  // TODO compute average points
  if (distancesquare < 10000) {
    distances.push(distancesquare)   
    goodmatchtokeep = goodmatchtokeep +1;
  }
}


const distance = numAverage(distances)
const devs = dev(distances)

 if (goodmatchtokeep <= numberofpointToMatch){
  orb.delete();
  keypoints1.delete();
  keypoints2.delete();
  descriptors1.delete();
  descriptors2.delete();
  tmp1.delete();
  tmp2.delete();
  // im1Graydst.delete();
  im2Graydst.delete();
  matches.delete();
  good_matches.delete();
  bf.delete(); 
  return false;
 }
 let realgoodmatchtokeep = 0;

 let good_matchesToKeep = [];
 for (let i = 0; i < good_matches.size(); i++) {
  let distancesquare  =((points1tmp[2*i] - points2tmp[2*i]) * (points1tmp[2*i] - points2tmp[2*i])) +    
  ((points1tmp[2*i+1] - points2tmp[2*i+1]) * (points1tmp[2*i+1] - points2tmp[2*i+1]))  
/*  console.log('distancesquare ' +distancesquare)   
  console.log('distance ' +distance)   
  console.log('devs ' + devs)   */
  // TODO compute average points
  if (distancesquare < (distance + 1* devs) && distancesquare > (distance - 1* devs)) {
    realgoodmatchtokeep = realgoodmatchtokeep +1
    good_matchesToKeep.push(i);
    break;
  }
}


/*let realgoodmatchtokeep1 = new cv.DMatchVector();

//  let counter = 0;
for (let i = 0; i < good_matches.size(); ++i) {
  if(good_matchesToKeep.includes(i)){
    realgoodmatchtokeep1.push_back(good_matches.get(i));
  }
}

if(realgoodmatchtokeep >0) {
  let imMatches = new cv.Mat();
  let color = new cv.Scalar(0, 255, 0, 255);
  cv.drawMatches(im1Graydst, keypoints1, im2Graydst, keypoints2, realgoodmatchtokeep1, imMatches, color);
  cv.imshow("canvas_output" + (1+i), imMatches); 

}*/


// console.log(realgoodmatchtokeep)
  if(realgoodmatchtokeep <=numberofgoodpointToMatch) {
    orb.delete();
    keypoints1.delete();
    keypoints2.delete();
    descriptors1.delete();
    descriptors2.delete();
    tmp1.delete();
    tmp2.delete();
    // im1Graydst.delete();
    im2Graydst.delete();
    matches.delete();
    good_matches.delete();
    bf.delete();     
    return false
  
  
  }
 else {    
    for (let  i in good_matchesToKeep) {
      points1.push(keypoints1.get(good_matches.get(+i).queryIdx).pt.x+ zone1.x);
      points1.push(keypoints1.get(good_matches.get(+i).queryIdx).pt.y+ zone1.y);
      points2.push(keypoints2.get(good_matches.get(+i).trainIdx).pt.x+ zone1.x);
      points2.push(keypoints2.get(good_matches.get(+i).trainIdx).pt.y+ zone1.y);
     
      /* let radius = 15;
      let center = new cv.Point(keypoints1.get(good_matches.get(i).queryIdx).pt.x+ zone1.x, keypoints1.get(good_matches.get(i).queryIdx).pt.y+ zone1.y);
      let center1 = new cv.Point(keypoints2.get(good_matches.get(i).trainIdx).pt.x+ zone1.x, keypoints2.get(good_matches.get(i).trainIdx).pt.y+ zone1.y);
      cv.circle(im1Gray, center, radius, [0, 0, 255, 255], 1);
      cv.circle(im2Gray, center1, radius, [0, 0, 255, 255], 1);
      cv.imshow("canvas_output6", im2Gray); 
      cv.imshow("canvas_output7" , im1Gray); */
    }
  
  

  orb.delete();
  keypoints1.delete();
  keypoints2.delete();
  descriptors1.delete();
  descriptors2.delete();
  tmp1.delete();
  tmp2.delete();
  // im1Graydst.delete();
  im2Graydst.delete();
  matches.delete();
  good_matches.delete();
  bf.delete(); 
  console.log('good match for zone ' + i + ' = ' + realgoodmatchtokeep)


  return true;

 }
}

function roi(src, rect, dst) {
  const srcMWidth = src.size().width;
  const srcMHeight = src.size().height;
  if (rect.x + rect.width > srcMWidth) {
    rect.width = srcMWidth - rect.x;
  }
  if (rect.y + rect.height > srcMHeight) {
    rect.height = srcMHeight - rect.y;
  }
  if (rect.x < 0) {
    rect.x = 0;
  }
  if (rect.y < 0) {
    rect.y = 0;
  }
  dst = src.roi(rect); 
  // You can try more different parameters
  return dst;
}

function numAverage(arr) {
  return arr.reduce((acc, curr)=>{
    return acc + curr
  }, 0) / arr.length;
}

// Javascript program to calculate the standered deviation of an array
function dev(arr){
  // Creating the mean with Array.reduce
  let mean = arr.reduce((acc, curr)=>{
    return acc + curr
  }, 0) / arr.length;
   
  // Assigning (value - mean) ^ 2 to every array item
  arr = arr.map((k)=>{
    return (k - mean) ** 2
  })
   
  // Calculating the sum of updated array
 let sum = arr.reduce((acc, curr)=> acc + curr, 0);
  
 // Calculating the variance
 // let variance = sum / arr.length
  
 // Returning the Standered deviation
 return Math.sqrt(sum / arr.length)
}