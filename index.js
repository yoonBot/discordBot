require('dotenv').config()

const Discord = require('discord.js');
const bot = new Discord.Client();
const ytdl = require('ytdl-core');
const token = 'NzY0MjIzMzMzOTczMDk4NTI5.X4DIcQ.NXqi8M-a1NZhzsdsQCdlwSkfR-U';
const PREFIX = '%';
const queue = new Map();
const{ executionAsyncResource } = require('async_hooks');
const{ YTSearcher } = require('ytsearcher');
const searcher = new YTSearcher({
    key: process.env.youtube_api,
    revealed: true
});

var count = 0;

bot.on('ready', () => {
	console.log('\nThis bot is online!');
    console.log('\n------< LOGS >------');
    bot.user.setActivity('%help', { type: 'LISTENING' }).catch(console.error);
})


bot.on('message', async message => {
	
	let args = message.content.substring(PREFIX.length).split(" ");
    const voiceChannel = message.member.voice.channel;
    const version = '1.0.0';
    const command = args.shift().toLowerCase();
    const serverQueue = queue.get(message.guild.id);

	switch (command){ 
	
    /* simple greeing */
		case 'greetings':
			message.channel.send('Hello, world');
    
    /* Embeds */
        case 'about':
            const embed = new Discord.MessageEmbed()
            .setTitle('BOT INFORMATION')
            .addField('CREATOR: JASON OH')
            .addField('VERSION:', version)
            .addField('CURRENT SERVER:', message.guild.name)
            .setFooter('github.com/yoonBot/yoonBot-Discord_bot')
            .setColor(0xF1C40F)
            .setThumbnail(message.author.displayAvatarURL())
            message.channel.send(embed);
            break;

     /* Music Bot */
         case 'play':
            execute(message, serverQueue);
            break;

         case 'leave':
            stop(message, serverQueue);
            break;

         case 'skip':
            skip(message, serverQueue);
            break;
         
         case 'pause':
            pause(serverQueue);
            break;

         case 'resume':
            resume(serverQueue);
            break;

         case 'loop':
            loop(args, serverQueue);
            break;

         case 'queue':
            queue(serverQueue);
            break;

     /* displays commands */
        

     /* Other cool features */
        
        default:
            break;

    }

    async function execute(message, serverQueue){
        let vc = message.member.voice.channel       //vc = voice channel
        if(!vc) return message.channel.send("You need to enter a voice channel to use this command");
        else{
            let result = await searcher.search(args.join(" "), { type: "video" })
            const songInfo = await ytdl.getInfo(result.first.url)
     
            let song = {
                title: songInfo.videoDetails.title,
                url: songInfo.videoDetails.video_url
            };
                        
            if(!serverQueue){
                const queueConstructor = {
                    txtChannel: message.channel,
                    vChannel: vc,
                    connection: null,
                    songs: [],
                    volume: 10,
                    playing: true,
                    loopone: false,
                    loopall: false
                };
                queue.set(message.guild.id, queueConstructor);

                queueConstructor.songs.push(song);

                try{
                    let connection = await vc.join();
                    queueConstructor.connection = connection;
                    play(message.guild, queueConstructor.songs[0]);
                } catch(err){
                    console.error(err);
                    queue.delete(message.guild.id);
                    return message.channel.send(`Unable to join the voice chat ${err}`)
                }
            }
            else{
                serverQueue.songs.push(song);
                return message.channel.send(`The song has been added to queue ${song.url}`);
            }
        }
    }       

    function play(guild, song){
        const serverQueue = queue.get(guild.id);
        if(!song){
            serverQueue.vChannel.leave();
            queue.delete(guild.id);
            return;
        }
        const dispatcher = serverQueue.connection
            .play(ytdl(song.url))
            .on('finish', () => {
                if(serverQueue.loopone){
                    play(guild, serverQueue.songs[0]);
                }
                else if(serverQueue.loopall){
                    serverQueue.songs.push(serverQueue.songs[0]);
                    serverQUeue.songs.shift();
                }
                else{
                    serverQueue.songs.shift();
                }
                play(guild, serverQueue.songs[0]);
            })
            serverQueue.txtChannel.send(`Now playing ${serverQueue.songs[0].url}`)  
            console.log(`${count++}. ${message.author.username} has requested to play ${serverQueue.songs[0]}`)
    }

    function stop(message, serverQueue){
        if(!message.member.voice.channel) return message.channel.send("You need to join the voice chat to activate this command");
        serverQueue.songs = [];
        serverQueue.connection.dispatcher.end();
        console.log(`${count++}. ${message.author.username} has requested the bot to leave the voice channel`)
    }

    function skip(message, serverQueue){
        if(!message.member.voice.channel) return message.channel.send("You need to join the voice chat to activate this command");
        if(!serverQueue) return message.channel.send("No music to skip!");
        serverQueue.connection.dispatcher.end();
        console.log(`${count++}. ${message.author.username} has requested to skip the song: ${serverQueue.songs[0]}`);
    }

    function pause(serverQueue){
        if(!serverQueue.connection) return message.channel.send("No music is currently playing!");
        if(!message.member.voice.channel) return message.channel.send("You need to join the voice chat to activate this command");
        if(serverQueue.connection.dispatcher.paused) return message.channel.send("The song is already paused");
        serverQueue.connection.dispatcher.pause();
        message.channel.send("The current song is now paused");
        console.log(`${count++}. ${message.author.username} has requested the bot to pause the current song: ${serverQueue.songs[0]}`)
    }

    function resume(serverQueue){
        if(!serverQueue.connection) return message.channel.send("There is no music to resume");
        if(!message.member.voice.channel) return message.channel.send("You need to join the voice chat to activate this command");
        if(serverQueue.connection.dispatcher.resumed) return message.channel.send("The song is already resumed");
        serverQueue.connection.dispatcher.resume();
        message.channel.send("The current song has been resumed");
        console.log(`${count++}. ${message.author.username} has requested the bot to resume the current song: ${serverQueue.songs[0]}`)
    }

    function loop(args, serverQueue){
        if(!message.member.voice.channel) return message.channel.send("You need to join the voice chat to activate this command");
        if(!serverQueue.connection) return message.channel.send("There is no music to loop!");
        switch (args[o],toLowerCase()){
            case 'all':
                serverQueue.loopall = !serverQueue.loopall;
                serverQueue.loopone = false;

                if(serverQueue.loopall === true){
                    message.channel.send("All songs in queue are now looped!"); 
                }
                else{
                    message.channel.send("Loop all has been turned off");
                }
                break;

            case 'one':
                serverQueue.loopone = !serverQueue.loopone;
                serverQueue.loopall = false;

                if(serverQueue.loopone === true){
                    message.channel.send("Current song is now looped!");
                }
                else{
                    message.channel.send("Loop one has been turned off");
                }
                break;

            case 'off':
                serverQueue.loopone = false;
                serverQueue.loopall = false;

                message.channel.send("Turning off loop...");
                break;

            default:
                meesage.channel.send("Please specify what you want to loop: !loop <all/off/one> ");
                
        }

    }

    function queue(serverQueue){

        if(!message.member.voice.channel) return message.channel.send("You need to join the voice chat to activate this command");
        if(!serverQueue.connection) return message.channel.send("There is no music to queue!");

        let nowPlaying = serverQueue.songs[0];
        let qMsg = `Now playing: ${nowPlaying.title}\n----------------- { QUEUE } ---------------\n`; 

        for (var i = 1; i < serverQueue.songs.length; i++){
            qMsg += `${i}. ${serverQueue.songs[i].title}\n`;
        }

        message.channel.send('```' + qMsg + 'Requested by: ' + message.author.username + '```');

    }

}) 


bot.login(process.env.token);
    
