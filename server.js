const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" },
    maxHttpBufferSize: 50e6 // 動画などの大きなファイルを受け取れるように50MBに拡張
});

// 静的ファイルの公開
app.use(express.static(path.join(__dirname, 'public')));

// メモリ上に動画データを保存（※サーバーを再起動するとリセットされますが、GASと組み合わせることも可能です）
let videos = [];

io.on('connection', (socket) => {
    // 動画一覧を送信
    socket.emit('load_videos', videos);

    // 動画投稿
    socket.on('upload_video', (data) => {
        const newVideo = {
            id: 'vid_' + Date.now(),
            title: data.title,
            thumbnail: data.thumbnail,
            videoUrl: data.videoUrl,
            views: 0,
            likes: 0,
            createdAt: new Date().toLocaleString()
        };
        videos.unshift(newVideo); // 新しい順に先頭に追加

        // 全員の画面に新しい動画を通知
        io.emit('new_video', newVideo);
    });

    // 高評価
    socket.on('like_video', (id) => {
        const target = videos.find(v => v.id === id);
        if (target) {
            target.likes++;
            io.emit('update_likes', { id: target.id, likes: target.likes });
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
