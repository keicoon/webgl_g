'use strict'

const fs = require('fs')

const _ = require('lodash')

const textureData = require('../data/texture')
const fontPath = require('../data/font')
const audioPath = require('../data/audio')
const spineData = require('../data/spine')
const live2dData = require('../data/live2d')

function GetPowerOfTwo(value, pow = 1) {
    while (pow < value) pow *= 2
    return pow;
}

class resourceManager {
    constructor(context) {
        this.context = context
        this.imgMap = new Map()
        this.audioMap = new Map()
        this.spineMap = new Map()
        this.live2dMap = new Map()
        this.maximumResourceNum = this.currentResourceNum = 0

        this.gl = this.context.gl
    }
    get IsLoaded() {
        return (this.currentResourceNum >= this.maximumResourceNum)
    }
    GetStatus() {
        return 'Loading... ' + this.currentResourceNum + ' / ' + this.maximumResourceNum
    }
    AddImage(name) {
        let img = new Image();
        img.src = textureData[name].src;
        ++this.maximumResourceNum;

        img.onload = () => {
            let texture = this.gl.createTexture();
            this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
            this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
            this.gl.bindTexture(this.gl.TEXTURE_2D, null);
            this.imgMap.set(name, { 'Id': textureData[name], 'Src': texture });
            ++this.currentResourceNum;
            console.log('#Loaded Image', name)
        }
    }
    GetImage(name) {
        return this.imgMap.get(name)
    }
    AddAllFont() {
        _.forEach(fontPath, (v, k) => this.AddFont(k))
    }
    AddFont(name) {
        let FontFace = this.context.FontFace
        let document = this.context.document
        let f = new FontFace(name, 'url(' + fontPath[name] + ')')
        ++this.maximumResourceNum
        f.load().then((loadedFace) => {
            document.fonts.add(loadedFace)
            ++this.currentResourceNum
            console.log('#Loaded Font', name)
        })
    }
    AddAudio(name, loop = false) {
        ++this.maximumResourceNum
        let sound = new Howl({
            src: [audioPath[name]]
        })
        sound.on('load', () => {
            sound.loop = loop
            this.audioMap.set(name, sound)
            ++this.currentResourceNum;
            console.log('#Loaded Audio', name)
        })
    }
    GetAudio(name) {
        return this.audioMap.get(name)
    }
    AddSpine(name) {
        const spine_data = spineData[name]
        this.spineMap.set(name, { src: new Map(), skelatal: spine_data.skelatal })

        for (let i = 0, n = spine_data.src.length; i < n; ++i) {
            let img = new Image();
            img.src = `${name}/${spine_data.src[i]}`
            ++this.maximumResourceNum;

            img.onload = () => {
                let canvas = this.context.canvas
                canvas.width = GetPowerOfTwo(img.width)
                canvas.height = GetPowerOfTwo(img.height)
                let ctx = canvas.getContext('2d')
                ctx.drawImage(img, 0, 0, img.width, img.height)

                let texture = this.gl.createTexture();
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture)
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, canvas);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
                this.gl.bindTexture(this.gl.TEXTURE_2D, null);
                this.spineMap.get(name).src.set(_.first(_.split(spine_data.src[i], '.')), { 'Image': img, 'Src': texture })
                ++this.currentResourceNum;
                console.log('#Loaded SpineImage', name + '/' + spine_data.src[i])
            }
        }
    }
    GetSpine(name) {
        return this.spineMap.get(name)
    }
    AddLive2D(name) {
        const live2d_data = live2dData[name]
        const model_binary = fs.readFileSync(live2d_data.model, 'binary')
        this.live2dMap.set(name, {src: new Map(), model: model_binary})

        for (var i = 0, n = live2d_data.textures.length; i < n; ++i) {
            let img = new Image();
            img.src = `${name}/${live2d_data.textures[i]}`
            ++this.maximumResourceNum;

            img.onload = () => {
                let texture = this.gl.createTexture();
                this.gl.pixelStorei(this.gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, 1);
                this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, 1);
                this.gl.activeTexture(this.gl.TEXTURE0);
                this.gl.bindTexture(this.gl.TEXTURE_2D, texture);
                this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
                this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_NEAREST);
                this.gl.generateMipmap(this.gl.TEXTURE_2D);
                this.gl.bindTexture(this.gl.TEXTURE_2D, null);
                this.live2dMap.get(name).src.set(_.first(_.split(spine_data.src[i], '.')), { 'Image': img, 'Src': texture })
                ++this.currentResourceNum;
                console.log('#Loaded Live2DImage', name + '/' + live2d_data.textures[i])
            }
        }
    }
    GetLive2D(name) {
        return this.live2dMap.get(name)
    }
    // Unload() {
    //     this.audioMap.map((v)=>{
    //         v.unload()
    //     })
    // }
}
module.exports = resourceManager