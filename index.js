
const fs = require('fs');
const path = require('path');
const express = require('express');
const { video64 } = require('./video');
const app = express();
/* 
const upload = multer({ dest: 'uploads/' }); */
//const compressVideo = require('compress-video');
const compressVideoLocal = require('./compressVideoLocal');
const compressVideoWithSizeAndDuration = require('./compressVideoWithLimit');

app.post('/upload', (req, res) => {
  //const outputFilePath = `compressed_${'videTest'}`;
  // Call the compression function here
  //const aux = compressVideo(Buffer.from(video64, "binary"));
  compressVideoFN(video64, res);
}); 

const compressVideoFN = async (inputVideo, res) =>{

/*   
  const inputPath = './testVideo.mp4';
  const inputStream = require('stream').Readable.from(videoBuffer);
  const outputPath = './compressed'
 */
  const videoBuffer = fs.readFileSync('testVideo.mp4');

  await compressVideoFn3( Buffer.from(videoBuffer, "binary"), 'test1', res );

}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const compressVideoFn3 = async (
  video,
  videoId,
  res
) => {

  const compressVideoOptions = {
    crf: 25,
    videoBitrate: '1M',
    audioBitrate: '128k' 
  } 
  if (!fs.existsSync(videoId)) {
    fs.writeFileSync(videoId, video);
  }

  const outputPath = './compressed'
  
  try {
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    const outputFileName = await compressVideoWithSizeAndDuration({
      inputPath: path.join(__dirname, videoId), 
      outputPath,
      options: compressVideoOptions,
    });

    console.log('Compression finished successfully:', outputFileName);
    res.send('Video uploaded and compressed successfully!');

  } catch (err) {
    console.error('Error during compression:', err);
    res.status(500).send('Compression failed.');
  }

  fs.unlink(videoId, (err) => {
    if (err) {
      console.error('Error al eliminar el archivo:', err);
    } else {
      console.log('Archivo temporal eliminado');
    }
  });
};

