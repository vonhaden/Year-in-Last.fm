<template>
    <b-container class="home">
        <b-button @click="pullLastFMInfo">Run</b-button>

        <div v-for="(artist, index) in artists.slice(0, 10)" :key="index">
            <p>{{ index + 1 }}. {{ artist.name }} - {{ artist.plays }}</p>
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
            status: 'waiting',
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
        async getDistinct(array){
            return [... new Set(array)]
        },
        async pullLastFMInfo(){
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

                            // Pull the Tracks out of the Response
                            response.forEach((page) => {
                                page.data.recenttracks.track.forEach((track) => {
                                    this.tracks.push(track);
                                })
                            })

                            // console.log(response);
                        })
                        .catch((error) => console.log(error))
                });
        },
        async populateArtistsArray(tracks){
            let list = [];

            tracks.forEach((track) => {
                list.push(track['artist']['#text']);
            })

            return list;
        },
        async populateSongsArray(tracks){
            let list = [];

            tracks.forEach((track) => {
                let song = {};
                song.name = track.name;
                song.album = track['album']['#text']
                song.artist = track['artist']['#text'];
                song.url = track.url;
                song.image = track.image[3]['#text'];

                list.push(song);
            })

            return list;
        },
        async arrayToJSON(array){
            let list = [];

            array.forEach((object) => {
                list.push(JSON.stringify(object));
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
        async getTopArtists(){
            let artists = [];
            let distinctArtists = [];

            artists = await this.populateArtistsArray(this.tracks);

            distinctArtists = await this.getDistinct(artists)

            let artistPlays = await this.artistPlayCount(artists, distinctArtists);

            this.artists = artistPlays;
        },
        async getTopSongs(){
            // Create and array filled with song objects
            const songs = await this.populateSongsArray(this.tracks);

            // Convert the objects to JSON for comparison
            let songsJSON = await this.arrayToJSON(songs);

            // Get the unique tracks
            let distinctSongsJSON = await this.getDistinct(songsJSON);

            // Get the playcount of each track and convert it fron JSON to objest
            let songPlayCount = await this.songPlayCount(songsJSON, distinctSongsJSON)

            this.songs = songPlayCount;
        },
        processData(){
            this.getTopArtists();
            this.getTopSongs();
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