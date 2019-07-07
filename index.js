var express = require('express');
var app = express();
var fs = require('fs');
var io = require('socket.io');
/*var key = fs.readFileSync('encryption/private.key');
var cert = fs.readFileSync('encryption/primary.crt');
var ca = fs.readFileSync('encryption/intermediate.crt');
var options = {
    key: key,
    cert: cert,
    ca: ca
};*/
var app = require('express')();
var https = require('http');
//var server = https.createServer(options, app);
var server = https.createServer(app);
var io = require('socket.io').listen(server);
server.listen(3002);

app.get('/*', function(req, res) {
    // res.send('Server');
    res.sendFile(__dirname + req.url);
}); //НАСТРОЙКИ ПОДКЛЮЧЕНИЯ

var players = [];
var rooms = [];

io.sockets.on('connection', function(socket) {

    console.log('Подключился: ' + socket.id);

    socket.on('p_connect', function(e) {
        socket.emit('pconnection', socket.id);
    });

    socket.on('add_player', function(data) {
        players[data.id] = data;
        console.log(players[data.id]);
        socket.join(players[data.id].room_id);
        rooms[players[data.id].room_id] = { //Создание комнаты
            id: players[data.id].room_id,
            full: false,
            started: false,
            con_player: [],
            bisy_id: []
        };
        rooms[players[data.id].room_id].con_player[0] = data.id;

        socket.emit('sucs', 1);
    });

    socket.on('change_room', function(data) {
        console.log(rooms.indexOf(data.room_id));
        if (rooms[data.room_id].full == false) {
            socket.join(data.room_id);
            rooms[data.room_id].full = true;
            socket.emit('sucs_change_room', {
                num: 1,
                room_id: data.room_id
            });
            rooms[data.room_id].con_player[1] = data.id;
            start_game(data.room_id);
            players[data.id].room_id = data.room_id;
            console.log(rooms[data.room_id]);
        } else //Не удалось
            socket.emit('sucs_change_room', 0);
    });

    socket.on('player_click', function(data) {
        data.x = currect_click(data.x);
        data.y = currect_click(data.y);
        if (rooms[data.room_id].bisy_id[data.x + "_" + data.y] == '-1') {
            console.log(data.id + ' Кликнул');
            if (players[data.id].walk == true) {
                rooms[data.room_id].bisy_id[data.x + "_" + data.y] = data.id;
                //Проверить на победу
                console.log(data.room_id);
                if (iswin(data.room_id, data.id) == true) {
                    socket.emit('text', 'Победил игрок: ' + players[data.id].name);
                    start_game(data.room_id);
                    console.log(players[data.id].name);
                }

                players[data.id].walk = false;
                if (rooms[data.room_id].con_player.indexOf(data.id) == 0) {
                    players[rooms[data.room_id].con_player[1]].walk = true;
                    //walked
                    io.to(data.room_id).emit("walked", {
                        name: players[rooms[data.room_id].con_player[1]].name
                    });

                } else {
                    players[rooms[data.room_id].con_player[0]].walk = true;
                    io.to(data.room_id).emit("walked", {
                        name: players[rooms[data.room_id].con_player[0]].name
                    });
                }

                io.to(players[data.id].room_id).emit('clicked', {
                    sign: players[data.id].sign,
                    x: currect_click(data.x),
                    y: currect_click(data.y)
                });
            }
        }
    });




});

function isdraw(room_id) {
    console.log(rooms[room_id]);
    for (let ind = 0; ind <= 300; ind += 150) {
        for (let inde = 0; inde <= 300; inde += 150) {
            if (rooms[room_id].bisy_id[ind + "_" + inde] == "-1") return false;
        }
    }
    return true;
}

function iswin(room_id, player_id) {
    if (isdraw(room_id) !== true) {
        if ((rooms[room_id].bisy_id['0_0'] == player_id) && (rooms[room_id].bisy_id['0_150'] == player_id) && (rooms[room_id].bisy_id['0_300'] == player_id)) return true;
        if ((rooms[room_id].bisy_id['150_0'] == player_id) && (rooms[room_id].bisy_id['150_150'] == player_id) && (rooms[room_id].bisy_id['150_300'] == player_id)) return true;
        if ((rooms[room_id].bisy_id['300_0'] == player_id) && (rooms[room_id].bisy_id['300_150'] == player_id) && (rooms[room_id].bisy_id['300_300'] == player_id)) return true;

        if ((rooms[room_id].bisy_id['0_0'] == player_id) && (rooms[room_id].bisy_id['150_0'] == player_id) && (rooms[room_id].bisy_id['300_0'] == player_id)) return true;
        if ((rooms[room_id].bisy_id['0_150'] == player_id) && (rooms[room_id].bisy_id['150_150'] == player_id) && (rooms[room_id].bisy_id['300_150'] == player_id)) return true;
        if ((rooms[room_id].bisy_id['0_300'] == player_id) && (rooms[room_id].bisy_id['150_300'] == player_id) && (rooms[room_id].bisy_id['300_300'] == player_id)) return true;

        if ((rooms[room_id].bisy_id['0_0'] == player_id) && (rooms[room_id].bisy_id['150_150'] == player_id) && (rooms[room_id].bisy_id['300_300'] == player_id)) return true;
        if ((rooms[room_id].bisy_id['300_0'] == player_id) && (rooms[room_id].bisy_id['150_150'] == player_id) && (rooms[room_id].bisy_id['0_300'] == player_id)) return true;

        return false;
    } else {
        //Ничья ПЕРЕЗАПУСК
        socket.emit('text', 'Ничья');
        start_game(room_id);
        return false;
    }
}

function start_game(room_id) {
    for (let ind = 0; ind <= 300; ind += 150) {
        for (let inde = 0; inde <= 300; inde += 150) {
            rooms[room_id].bisy_id[ind + "_" + inde] = "-1";
        }
    }
    players[rooms[room_id].con_player[0]].sign = 'cross'; //Тут должен быть несправедливый рандом
    players[rooms[room_id].con_player[1]].sign = 'circle';
    players[rooms[room_id].con_player[0]].walk = true;
    rooms[room_id].started = true;
    console.log(rooms[room_id]);
    io.to(room_id).emit("game_start", {
        name: players[rooms[room_id].con_player[0]].name
    });
}

function isInteger(num) {
    return (num ^ 0) === num;
}

function currect_click(coord) {
    if (isInteger(coord / 150)) return coord;
    else {
        coord--;
        return currect_click(coord);
    }
}