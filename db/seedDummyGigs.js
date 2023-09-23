
const pool = require('./index.js')
const fs = require('fs')
const axios = require('axios')

const sampleGigTitles = [
    'Live Jazz Performance',
    'Rock Concert with Local Bands',
    'Acoustic Jam Night',
    'Electronic Music DJ Set',
    'Blues and Soul Showcase',
    'Indie Folk Singer-Songwriter',
    'Hip-Hop Open Mic Night',
    'Reggae and Dub Fusion',
    'Classical Chamber Orchestra',
    'Pop Cover Band Extravaganza',
    'Country Music Hoedown',
    'Latin Salsa Dance Party',
    'R&B and Funk Groove Night',
    'Metalcore and Hardcore Show',
    'World Music Fusion Ensemble',
    'Punk Rock Revival',
    'Alternative Indie Rockers',
    'EDM Festival Headliners',
    'Gospel Choir and Worship',
    'Experimental Music Jam Session',
  ];

  const description = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam eget mi sed neque convallis suscipit. Nulla facilisi. Sed ut risus in turpis vulputate lobortis. Vivamus eget neque justo. Fusce ut lorem vitae quam ultricies hendrerit. Suspendisse potenti. Vestibulum sit amet tristique dolor. Integer eu nunc vitae risus commodo sodales ac eget libero. Fusce a dui non nisl vestibulum eleifend ac nec nulla. Sed luctus scelerisque semper. Nunc vel eleifend sapien. Maecenas vel ex id tellus tincidunt tincidunt.

  Pellentesque at odio orci. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia Curae; Sed facilisis ultrices elit, et vehicula purus facilisis non. Maecenas auctor, dolor nec interdum tempus, ex nulla laoreet odio, in vehicula lorem orci eu eros. Sed egestas bibendum odio, ut malesuada orci posuere id. Donec nec tortor ut est congue volutpat. Nulla facilisi. Quisque sit amet egestas urna. Aenean vehicula, mi eu faucibus efficitur, nisl mi bibendum metus, id cursus mi velit eu urna. Sed fermentum lectus in felis tempor, id vehicula urna sagittis.`;

  const city = 'Melbourne';

  const address = '23 Sample Street';

  const artistNames = [
    'The Rockin Rollers',
    'Electric Echoes',
    'Soulful Serenades',
    'Funky Fusion Collective',
    'The Jazz Jesters',
    'Indie Harmony Project',
    'Rhythm Rebels',
    'Country Roads Band',
    'Reggae Rhythms Crew',
    'Alternative Alchemists',
    'Bluesy Beats Ensemble',
    'Hip-Hop Haven',
    'Pop Sensation Stars',
    'Classical Crescendo Orchestra',
    'Metal Mayhem Squad',
    'The Groove Gurus',
    'Punk Revolutionaries',
    'EDM Energy Wave',
    'Gospel Grace Choir',
    'Experimental Sound Explorers',
  ];

  const start_time = '2100';
  const finish_time = '2355';

  const venueNames = ['The Gasometer Hotel', 'Last Chance Rock and Roll Bar', 'Stay Golden Bar', 'The Tote', 'Fairfield Amphitheatre'];

  const tickets_link = `www.google.com`;

  const genres = [
    'Rock',
    'Pop',
    'Hip-Hop',
    'Jazz',
    'Blues',
    'Country',
    'Classical',
    'Electronic',
    'R&B',
    'Reggae',
    'Folk',
    'Metal',
    'Punk',
    'Alternative',
    'Soul',
    'Funk',
    'Indie',
    'Disco',
    'Techno',
  ];

function generateRandomDay () {
    let minDay = 1;
    let maxDay = 31;
  
    const randomDay = Math.floor(Math.random() * (maxDay - minDay + 1)) + minDay;

    return randomDay.toString().padStart(2, '0');
}

async function seedDummyGigs() {

    
    const imagePath = '../samples/sample';
    
    
    for(let i = 0; i < 10; i++ ) {
        let keywords = [genres[Math.floor(Math.random() * 20)], genres[Math.floor(Math.random() * 20)], genres[Math.floor(Math.random() * 20)]];
        
        

        const fd = new FormData();

        let day = generateRandomDay();

        let date = `${day}/10/2023`;

        const imageBuffer = fs.readFileSync(`${imagePath}${Math.floor(Math.random() * 13) + 1}.jpg`)

        const imageBlob = new Blob([imageBuffer], { type: 'image/jpeg' });

        fd.append('image', imageBlob, 'image.jpg');
        fd.append('title', sampleGigTitles[Math.floor(Math.random() * 20)]);
        fd.append('description', description)
        fd.append('city', city)
        fd.append('address', address)
        fd.append('artist', artistNames[Math.floor(Math.random() * 20)])
        fd.append('start_time', start_time)
        fd.append('keywords', keywords)
        fd.append('finish_time', finish_time)
        fd.append('tickets_link', tickets_link)
        fd.append('date', date)
        fd.append('venue_name', venueNames[Math.floor(Math.random() * 5)])
        fd.append('username', 'developer1')







        let result = await axios.post('http://localhost:3000/gigs', fd)

    }


    

}

seedDummyGigs();