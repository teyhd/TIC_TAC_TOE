var socket = io('', { reconnection: false }); //reconnection: false
console.log(socket);
var canv = document.getElementById('tic-canvas');
var ctx = canv.getContext("2d");
var text_msg = $('.msg'); //Сообщения от сервера


var btn_name_inp = $("#button-name"); //Ввел имя перед началом игры
var inp_name = $('#input-name'); //Поле для ввода имени
var div_name_inp = $(".name-input"); //Сообщение о вооде имени
var div_room_id = $("#room-id"); //Поле ид комнаты
var walked_name = $("#player"); //Имя игрока который делает ход

var room_inp_conn = $("#input-room"); //Поля для ввода ида для подключения
var btn_connect = $("#button-room").attr("disabled", true); //Кнопка для подключения к комнате

text_msg.hide();

var player = {
    id: "id",
    name: "Player",
    sign: "cross",
    walk: false,
    room_id: 546
}
console.log(btn_name_inp);
btn_name_inp.on('click', function() { //Ввел имя
    player.name = inp_name.val();
    if (player.name == '') player.name = "Default player name";
    socket.emit('p_connect', 0); //Отправляем запрос на сервер
    div_name_inp.hide(); //Убираем поле для ввода
});

btn_connect.on('click', function() { //Запрос на смену комнаты
    let number_room = room_inp_conn.val();
    if ((number_room !== '') && (number_room !== '' + player.room_id))
        socket.emit('change_room', {
            id: player.id,
            room_id: number_room
        }); //Отправляем запрос на сервер
    else {
        alert('Ошибка ввода');
    }
});

socket.on('pconnection', function(msg) { //Ответ
    player.id = msg; //Записываем сокет ид
    player.room_id = Math.floor(Math.random() * (99999 - 10000) + 99999); //Придумываем ид комнаты
    div_room_id.text(player.room_id);
    socket.emit('add_player', player); //Отправляем инфу о пользователе
});

socket.on('sucs', function(msg) { //Подключение успешно
    console.log('Успешно подключен');
    btn_connect.attr("disabled", false);
});
socket.on('sucs_change_room', function(msg) { //Подключение успешно
    if (msg.num == 1) {
        div_room_id.text(msg.room_id);
        player.room_id = msg.room_id;
    } else {

    }
});

socket.on('game_start', function(msg) { //Подключение успешно
    walked_name.text(msg.name);
    field_init();
    console.log("Начало игры");
});

socket.on('walked', function(msg) { //Подключение успешно
    walked_name.text(msg.name);
});


function field_init() {
    ctx.clearRect(0, 0, 5000, 5000);
    ctx.strokeStyle = '#4d5dfc';
    ctx.lineWidth = 1;
    for (let ind = 0; ind <= 450; ind += 150) {
        for (let inde = 0; inde <= 450; inde += 150) {
            ctx.strokeRect(ind, inde, 150, 150);
        }
    }

}
field_init();


function add_circle(x, y) {
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#ee4035';
    ctx.beginPath();
    ctx.arc(x + 75, y + 75, 60, 0, Math.PI * 2, true); // Внешняя окружность
    ctx.stroke();
}

function add_cross(x, y) { //Левый верхний угол квадрата
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#0392cf';
    ctx.beginPath();
    ctx.moveTo(x + 5, y + 5);
    ctx.lineTo(x + 145, y + 145);
    ctx.moveTo(x + 145, y + 5);
    ctx.lineTo(x + 5, y + 145);
    ctx.stroke();
}
socket.on('text', function(msg) {
    text_msg.show();
    text_msg.text(msg);
    setTimeout(function() { text_msg.hide(); }, 3000);
});

socket.on('clicked', function(msg) {
    if (msg.sign == 'cross') add_cross(msg.x, msg.y);
    else add_circle(msg.x, msg.y);
});

canv.addEventListener('mousedown', function(e) {
    if (socket.disconnected !== true) {
        socket.emit('player_click', {
            id: player.id,
            room_id: player.room_id,
            x: e.layerX,
            y: e.layerY,
        });
    } else {
        alert('Обновляем страницу. Ты потерял соединение!!!');
        location.reload(true);
        //Если соединение потеряно надо что-то делать
    }
});