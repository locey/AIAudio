import React, { useState } from 'react';
import './App.css';

function App() {
  const [downloadLinks, setDownloadLinks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e) => {
    e.preventDefault();
    setIsProcessing(true); // 开始处理，显示处理中的提示
    const file = e.target.elements.file.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://106.15.225.167:3001/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.text();

      // 解析响应中的下载链接
      const parser = new DOMParser();
      const htmlDocument = parser.parseFromString(data, "text/html");
      const links = htmlDocument.getElementsByTagName("a");
      const downloadLinkElements = Array.from(links).map((link, index) => ({
        id: index,
        href: link.href.replace('localhost:3000', 'localhost:3001'),
        text: link.textContent,
      }));

      setDownloadLinks(downloadLinkElements);
      setIsProcessing(false); // 处理完成，显示正常界面
    } catch (error) {
      console.error('上传错误:', error);
      setIsProcessing(false); // 出错时，也需要停止显示处理中的提示
    }
  };

  return (
    <div className="app">
      {isProcessing ? (
        <div className="processing-message">
          AI正在处理中，请稍后...
        </div>
      ) : (
        <div className="content">
          <div className="upload-section">
            <h1>上传文件</h1>
            <form onSubmit={handleFileUpload}>
              <input type="file" name="file" required />
              <button type="submit">上传</button>
            </form>
          </div>
          <div className="download-section">
            <h2>下载文件</h2>
            <div className="links">
              {downloadLinks.map((item) => (
                <div key={item.id} className="download-link">
                  <a href={item.href} target="_blank" rel="noopener noreferrer">{item.text}</a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
