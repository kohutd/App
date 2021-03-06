/*
 * Telegram V
 * Copyright (C) 2020 original authors
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 */

import FileManager from "../../Api/Files/FileManager"
import {FileAPI} from "../../Api/Files/FileAPI"
import MTProto from "../../MTProto/External"
import AppEvents from "../../Api/EventBus/AppEvents"
import UIEvents from "../../Ui/EventBus/UIEvents"
import keval from "../../Keval/keval";
import Settings from "../../Api/Settings/Settings"

class WallpaperManagerSingleton {
    wallpapers = [];
    isFetching = false;

    init() {
        //AppEvents.Files.subscribe("download.done", this.onFileDownloaded);

        Settings.initPromise.then(() => {
            const background = Settings.get("background");
            if (!background || !(background.color || background.blob)) {
                this.setWallpaper("./static/images/default_bg.jpg", 0, false)
                return;
            }
            if (background.color) {
                this.setColor(background.color);
            }
            if (background.blob) {
                let url = URL.createObjectURL(background.blob);
                this.setWallpaper(url, 0, false);
            }
            
        })
    }

    fetchAllWallPapers() {
        if (this.isFetching) {
            return this.fetchPromise;
        }

        if (this.wallpapers.length > 0) {
            return Promise.resolve(this.wallpapers);
        }

        this.isFetching = true;

        return this.fetchPromise = MTProto.invokeMethod("account.getWallPapers", {hash: 0}).then(result => {

            this.wallpapers = result.wallpapers;
            //console.log(this.wallpapers);
            this.isFetching = false;

            UIEvents.General.fire("wallpaper.fetched", {wallpapers: this.wallpapers});

            /*this.wallpapers.forEach(wallpaper => { // don't download with fetching
                FileManager.downloadDocument(wallpaper.document, undefined, true);
            });*/

            return this.wallpapers;
        });
    }

    getSelectedId() {
        Settings.initPromise.then(() => {
            return Promise.resolve(Settings.get("background.wallpaper_id"));
        })
        return Promise.resolve();
    }

    async fetchPreview(wallpaper) {
        return FileAPI.photoThumbnail(wallpaper.document).then(thumb => {
            return thumb.src;
        });
    }

    async requestFull(wallpaper) {
        return FileManager.downloadDocument(wallpaper.document).then(async ({blob}) => {
            if(wallpaper.pattern) {
                let type = "png";
                let typeAttr = wallpaper.document.attributes.find(attr => attr._ =="documentAttributeFilename");
                if(typeAttr) {
                    let split = typeAttr.file_name.split(".");
                    type = split[split.length-1];
                }
                
                if(type === "tgv") { //gzipped svg
                    blob = await MTProto.performWorkerTask("gzipUncompress", new Uint8Array(await blob.arrayBuffer())).then(bytes => {
                        return new Blob([bytes], {type: "image/svg+xml"});
                    })
                }
            }
            if(!blob) return; //fail
            UIEvents.General.fire("wallpaper.fullReady", {
                id: wallpaper.document.id,
                wallpaperUrl: URL.createObjectURL(blob)
            })
            return blob;
        });
    }

    requestAndInstall(wallpaper) {
        this.requestFull(wallpaper).then(blob => {
            this.setWallpaper(URL.createObjectURL(blob), wallpaper.id);
        })
    }

    setWallpaper(url, wallpaperId = 0, save = true) {
        if (!url) {
            window.document.body.style.setProperty("--chat-bg-image", `none`); //html element changes with each resize, causing background flickering
            return;
        }
        window.document.body.style.setProperty("--chat-bg-image", `url(${url})`);
        if(save) {
            fetch(url).then(async response => {
                let blob = await response.blob();
                Settings.set("background.blob", blob)
                Settings.set("background.wallpaper_id", wallpaperId);
            })
        }
    }

    setColor(hex) {
        if (!hex) {
            window.document.body.style.setProperty("--chat-bg-color", "none");
            return;
        }
        this.setWallpaper(undefined); //remove wallpaper
        window.document.body.style.setProperty("--chat-bg-color", hex);
        Settings.set("background.color", hex);
    }

    /*onFileDownloaded = event => {
        if (!this.wallpapers.find(w => w.document.id === event.file.id)) {
            return;
        }

        if (event.thumbSize) {
            UIEvents.General.fire("wallpaper.previewReady", {
                id: event.file.id,
                wallpaperUrl: event.url
            });
        } else {
            if (this.currentWallpaper?.document.id === event.file.id) {
                this.setWallpaper(URL.createObjectURL(event.blob)); //apply full wallpaper
            }

            UIEvents.General.fire("wallpaper.fullReady", {
                id: event.file.id,
                wallpaperUrl: event.url
            });
        }
    }*/
}

const WallpaperManager = new WallpaperManagerSingleton();

export default WallpaperManager;