import http from "node:http";

// Protect against unhandled socket resets
process.on("uncaughtException", (err) => {
  if (err.code === "ECONNRESET" || err.code === "EPIPE" || err.code === "ECONNABORTED") {
    // Normal browser disconnection / HMR reload, ignore safely
    return;
  }
  console.error("Dev proxy caught exception:", err.message);
});

process.on("unhandledRejection", (reason) => {
  console.error("Dev proxy unhandled rejection:", reason);
});

function startProxy(listenPort, targetPort = 8080) {
  const server = http.createServer((req, res) => {
    req.on("error", () => {});
    res.on("error", () => {});

    const options = {
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${targetPort}`,
      },
    };

    const proxyReq = http.request(options, (proxyRes) => {
      proxyRes.on("error", () => {});
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res, { end: true });
    });

    proxyReq.on("error", (err) => {
      if (!res.headersSent) {
        res.writeHead(502, { "Content-Type": "text/html" });
        res.end(`<h3>Proxying to http://localhost:${targetPort} failed: ${err.message}</h3>`);
      }
    });

    req.pipe(proxyReq, { end: true });
  });

  server.on("clientError", (err, socket) => {
    if (err.code === "ECONNRESET" || !socket.writable) return;
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  server.on("upgrade", (req, socket, head) => {
    socket.on("error", () => {
      socket.destroy();
    });

    const proxyReq = http.request({
      hostname: "127.0.0.1",
      port: targetPort,
      path: req.url,
      method: req.method,
      headers: {
        ...req.headers,
        host: `localhost:${targetPort}`,
      },
    });

    proxyReq.on("upgrade", (proxyRes, proxySocket, proxyHead) => {
      proxySocket.on("error", () => {
        proxySocket.destroy();
        socket.destroy();
      });

      socket.write(`HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n`);
      proxySocket.pipe(socket);
      socket.pipe(proxySocket);
    });

    proxyReq.on("error", () => {
      socket.destroy();
    });

    proxyReq.end();
  });

  server.listen(listenPort, "0.0.0.0", () => {
    console.log(`Port forwarder listening on http://localhost:${listenPort} -> http://localhost:${targetPort}`);
  });
}

// Support both standard Vite (5173) and React (3000) ports
startProxy(5173, 8080);
startProxy(3000, 8080);
