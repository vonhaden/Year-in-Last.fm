<template>
    <b-container class="home">
        <b-button @click="pullLastFMInfo" v-if="!tracks.length">Run</b-button>

        <div>
            <p>{{status}}</p>
        </div>

        <div v-if="artists.length">
            <h2>Top Artists</h2>
            <div v-for="(artist, index) in artists.slice(0, 10)" :key="index">
                <p>{{ index + 1 }}. {{ artist.name }} - {{ artist.plays }}</p>
            </div>
            <hr>
        </div>

        <div v-if="songs.length">
            <h2>Top Songs</h2>
            <div v-for="(song, index) in songs.slice(0, 10)" :key="index">
                <p>{{ index + 1 }}. {{ song.name }} - {{ song.artist }} ({{ song.plays }} plays)</p>
            </div>
        </div>

        <div v-if="albums.length">
            <h2>Top Albums</h2>
            <div v-for="(album, index) in albums.slice(0, 10)" :key="index">
                <p>{{ index + 1 }}. {{ album.name }} - {{ album.artist }} ({{ album.plays }} plays)</p>
            </div>
        </div>

    </b-container>
</template>

<script>
import axios from 'axios'

export default {
    name: "Home",
    data() {
        return {
            tracks: [ ],
            artists: [ ],
            songs: [ ],
            albums: [ ],
            status: 'Waiting',
            year: null,
            apiURL: 'https://ws.audioscrobbler.com/2.0/',
            username: 'itochan60',
            apiParams: {
                method: 'user.getRecentTracks',
                api_key: '75a043b2c8351867a2af03680101f7bd',
                user: 'itochan60',
                format: 'json',
                limit: 200,
                page: 1,
                from: this.dateToTime('2020'),
                to: this.dateToTime( new Date )
            },
        }
    },
    watch: {
        tracks: {
            handler: 'processData'
        }
    },
    methods: {
        dateToTime(date){
           return new Date(date).getTime()/1000;
        },
        processData(){
            this.getTopArtists();
            this.getTopSongs();
            this.getTopAlbums();
        },
        async getDistinct(array){
            return [... new Set(array)]
        },
        async arrayToJSON(array){
            let list = [];

            array.forEach((object) => {
                list.push(JSON.stringify(object));
            })

            return list;
        },
        async pullLastFMInfo(){
            this.status = 'Fetching Data from Last.fm';

            let params = this.apiParams;

            axios.get( this.apiURL, { params } )
                .then((response) => {
                    // Set a variable for the total number of pages (total tracks / per page)
                    let totalPages = Number(response.data['recenttracks']['@attr']['totalPages']);

                    // Create empty promise Array
                    let promises = [];

                    // Create a Axios get call for each
                    for (params.page; params.page <= totalPages; params.page++){
                        promises.push(
                            axios.get(this.apiURL, {params})
                        );
                    }

                    // Make calls to pull all the data from Last.fm
                    Promise.all(promises)
                        .then((response) => {
                            this.status = 'Data received from Last.fm';

                            // Pull the Tracks out of the Response
                            response.forEach((page) => {
                                page.data.recenttracks.track.forEach((track) => {
                                    let song = {};
                                    song.name = track.name;
                                    song.album = track['album']['#text']
                                    song.artist = track['artist']['#text'];
                                    song.url = track.url;
                                    song.image = track.image[3]['#text'];

                                    this.tracks.push(song);
                                })
                            })

                        })
                        .catch((error) => {
                            console.log(error);
                            this.status = error;
                        })
                });
        },
        async populateArtistsArray(tracks){
            let list = [];

            tracks.forEach((track) => {
                list.push(track.artist);
            })

            return list;
        },
        async populateAlbumsArray(tracks){
            let list = [];

            tracks.forEach((track) => {
                let album = {};
                album.name = track.album;
                album.artist = track.artist;
                album.image = track.image;

                list.push(album);
            })

            return list;
        },
        async songPlayCount(songs, distinctSongs){
            let list = [];

            // Find the number of plays for each artist, create an object with name and plays, and object to list
            distinctSongs.forEach((distinctSong) => {
                let count = 0;

                songs.forEach((song) => {
                    if (song === distinctSong) { count++ }
                })

                let formattedSong = JSON.parse(distinctSong);
                formattedSong.plays = count;

                list.push(formattedSong);

            })

            // Sort the array of objects base on play count
            list.sort((a, b) => {
                return  b.plays - a.plays;
            })

            // TODO: Fix jank workaround for now playing track
            // Remove track from top song list if it currently is being played
            // If a song is currently being played it randomly have a high number of plays
            if (this.tracks[0]['@attr']){
                list.shift();
            }

            return list;
        },
        async artistPlayCount(artists, distinctArtists){
            // Create an empty array
            let list = [];

            // Find the number of plays for each artist, create an object with name and plays, and object to list
            distinctArtists.forEach((artist) => {
                let count = 0;

                artists.forEach((v) => {
                    if (v === artist) { count++ }
                })

                list.push({name: artist, plays: count});

            })

            // Sort the array of objects base on play count
            list.sort((a, b) => {
                return  b.plays - a.plays;
            })

            return list;
        },
        async albumsPlayCount(albumsJSON, songs){
            let list = [];

            albumsJSON.forEach((albumJSON) => {
                let album = JSON.parse(albumJSON);
                album.plays = 0;

                songs.forEach((song) => {
                    if (song.album === album.name && song.artist === album.artist){
                        album.plays ++;
                    }
                })

                list.push(album);
            })

            // Sort the array of objects base on play count
            list.sort((a, b) => {
                return  b.plays - a.plays;
            })

            return list;
        },
        async getTopSongs(){
            // Convert the objects to JSON for comparison
            let songsJSON = await this.arrayToJSON(this.tracks);

            // Get the unique tracks
            let distinctSongsJSON = await this.getDistinct(songsJSON);

            // Get the play count of each track and convert it from JSON to object
            this.songs = await this.songPlayCount(songsJSON, distinctSongsJSON);
        },
        async getTopArtists(){
            let artists = await this.populateArtistsArray(this.tracks);

            let distinctArtists = await this.getDistinct(artists)

            this.artists = await this.artistPlayCount(artists, distinctArtists);
        },
        async getTopAlbums(){
            // Create albums array from tracks array
            let albums = await this.populateAlbumsArray(this.tracks);

            // Convert the objects to JSON for comparison
            let albumsJSON = await this.arrayToJSON(albums);

            // Get the unique albums
            let distinctAlbumsJSON = await this.getDistinct(albumsJSON);

            // Count the number of plays per albums
            this.albums = await this.albumsPlayCount(distinctAlbumsJSON, this.tracks);
        }
    },
    mounted () {
        let date = new Date;
        this.year = date.getFullYear();
    }
}
</script>

<style scoped>

</style>