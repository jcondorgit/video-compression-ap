const fs = require("fs-extra");
const ffmpegStatic = require("ffmpeg-static");
const ffmpeg = require("fluent-ffmpeg");
const ffprobe = require("ffprobe"),
  ffprobeStatic = require("ffprobe-static");

ffmpeg.setFfprobePath(ffprobe);
ffmpeg.setFfmpegPath(ffmpegStatic);

const path = require('path'); 

const minSize = 500 * 1024;
const maxSize = 1.4 * 1024 * 1024; 

const compressVideoWithSizeAndDuration = async ({
  inputPath,
  outputPath,
  options: { crf, videoBitrate, audioBitrate },
}) => {
    try {
        const fileName = path.basename(inputPath, path.extname(inputPath));
        const outputFileName = `${fileName}_compressed.mp4`;
        const outputFilePath = path.join(outputPath, outputFileName);
      
        fs.ensureDirSync(outputPath);
          
        const { streams } = await new Promise((resolve, reject) => {
          ffprobe(inputPath, { path: ffprobeStatic.path }, (err, metadata) => {
            if (err) return reject(err);
            resolve(metadata);
          });
        });
      
        const duration = streams[0].duration;
      
        let bitrateAdjustmentFactor = 1;
        if (duration < 60) bitrateAdjustmentFactor = 0.8;
        else if (duration > 300) bitrateAdjustmentFactor = 1.2;
      
        let defaultCrf = crf || 23;
        const defaultVideoBitrate = videoBitrate || "1000k";
        const defaultAudioBitrate = audioBitrate || "320k";
      
        let parsedBitrate = parseInt(defaultVideoBitrate.replace('k', ''));
        let adjustedBitrate = `${parsedBitrate * bitrateAdjustmentFactor}k`;
      
        while (true) {
      
          await new Promise((resolve, reject) => {
            ffmpeg(inputPath)
              .videoCodec("libx264")
              .audioCodec("libmp3lame")
              .videoBitrate(adjustedBitrate)
              .audioBitrate(defaultAudioBitrate)
              .outputOptions(`-crf ${defaultCrf}`)
              .on("error", (err) => {
                console.error("Error durante la compresión:", err);
                reject({ error: err, message: "Error durante la compresión" });
              })
              .on("end", resolve)
              .save(outputFilePath);
          });
      
          const fileSize = fs.statSync(outputFilePath).size;
          console.log(`Tamaño comprimido: ${(fileSize / 1024).toFixed(2)} KB`);
      
          if (fileSize >= minSize && fileSize <= maxSize) {
            console.log("Compresión exitosa dentro del rango especificado.");
            break;
          }
          
          defaultCrf = defaultCrf - 1;
          console.log(`Nuevo Crf ajustado: ${defaultCrf}`);
          /* parsedBitrate = fileSize > maxSize
            ? parsedBitrate * 0.9
            : parsedBitrate * 1.5;
      
          adjustedBitrate = `${parsedBitrate}k`;
          console.log(`Nuevo bitrate ajustado: ${adjustedBitrate}`); */
        }
      
        return {
          duration,
          fileSize: (fs.statSync(outputFilePath).size / 1024).toFixed(2) + " KB",
        };
      
      } catch (error) {
        console.error("Error en el proceso de compresión:", error);
        throw error;
      }
};

module.exports = compressVideoWithSizeAndDuration;
