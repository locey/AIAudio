const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const cors = require('cors');

const app = express();
app.use(cors());


// 确保有这些目录
const uploadDir = 'uploads';
const processedDir = 'processed'; // 处理后的文件将保存在 'processed' 目录
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(processedDir, { recursive: true });

// 设置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, file.originalname)
});
const upload = multer({ storage });

// 文件上传路由
app.post('/upload', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).send('请上传文件');
  }

  // 定义 Python 脚本的路径和参数
  const scriptPath = './inference.py';
  const inputFilePath = `../${uploadDir}/${file.filename}`;
  const outputDir = '../processed';

  // 构建并执行 Python 命令
  const pythonCommand = `python ${scriptPath} --input ${inputFilePath} --output_dir ${outputDir}`;
  const execOptions = {
    cwd: './vocal-remover/', // 设置 Python 脚本的工作目录
  };

  exec(pythonCommand, execOptions, (error, stdout, stderr) => {
    if (error) {
      console.error(`执行错误: ${error}`);
      return res.status(500).send('文件处理失败');
    }
    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    // 处理后的文件名
    const baseName = path.basename(file.filename, path.extname(file.filename));
    const vocalFile = `${baseName}_Vocals.wav`;
    const instrumentFile = `${baseName}_Instruments.wav`;

    // 返回下载链接
    const vocalEncodedFilename = encodeURIComponent(vocalFile);
    const instrumentEncodedFilename = encodeURIComponent(instrumentFile);
    res.send(`
      <a href="/download/${vocalEncodedFilename}">下载人声文件</a><br>
      <a href="/download/${instrumentEncodedFilename}">下载乐器文件</a>
    `);
  });
});

// 文件下载路由
app.get('/download/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filepath = `${processedDir}/${filename}`;

  // 检查文件是否存在
  if (!fs.existsSync(filepath)) {
    return res.status(404).send(`文件未找到: ${filename}`);
  }

  res.setHeader('Content-Disposition', 'attachment; filename=' + encodeURIComponent(filename));
  res.download(filepath, filename);
});

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => console.log(`服务器运行在 http://localhost:${PORT}`));
