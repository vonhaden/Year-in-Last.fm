<template>
    <b-container class="home">
        <b-button @click="pullLastFMInfo">Run</b-button>
        <b-button @click="getTopArtists">Artists</b-button>

        <div v-for="(track, index) in tracks" :key="index">
            <p>{{ track.name }} - {{ track.artist['#text'] }}</p>
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
            handler: 'getTopArtists'
        }
    },
    methods: {
        dateToTime(date){
           return new Date(date).getTime()/1000;
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
        async getDistinct(array){
            return [... new Set(array)]
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

                list.push({artist: artist, plays: count});

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

            console.log(artistPlays);
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