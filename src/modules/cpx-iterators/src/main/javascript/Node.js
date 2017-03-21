const stream = require("stream");

module.exports = class Node {

    constructor(fn, modes) {
        if (modes === undefined) {
            modes = 2;
        }
        this.fn = fn;
        this.source = null;
        this.channel = {};
        switch(JSON.stringify([fn.length,modes & 3])) {
            case "[1,0]":
            case "[1,2]":
                this.channel = {
                    readable: null
                };
                break;
            case "[1,1]":
            case "[1,3]":
                this.channel = {
                    writable: null
                };
                break;
            case "[2,1]":
                this.channel = {
                    writable: null,
                    readable: null
                };
                break;
            case "[2,2]":
                this.channel = {
                    readable: null,
                    writable: null
                }
                break;
            default:
                throw new Error("not implemented");
        }
    }

    start() {
        let argv = Object.keys(this.channel);
        for (let i = 0; i < argv.length; ++i) {
            argv[i] = this.channel[argv[i]];
        }
        this.fn.apply(null, argv);
    }

    connect() {
        let node = this;
        if (node.channel.writable !== null) {
            let passthrough = node.channel.readable = new stream.PassThrough();
            node.start();
            node = node.source;
            while (node) {
                if (node.channel.writable !== null) {
                    throw new Error("tee not implemented");
                }
                node.channel.writable = passthrough;
                passthrough = node.channel.readable = new stream.PassThrough();
                node.start();
                node = node.source;
            }
        }
    }

    pipe(nodeOrWritable) {
        if (nodeOrWritable instanceof Node) {
            if (nodeOrWritable.channel.readable !== null) {
                throw new Error("node already connected");
            }
            nodeOrWritable.source = this;
            nodeOrWritable.connect();
        } else {
            this.channel.writable = nodeOrWritable;
            this.connect();
        }
        return nodeOrWritable;
    }

};
