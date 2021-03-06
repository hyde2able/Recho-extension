import Flowly from 'flowly-js'
import io from 'socket.io-client'
import $ from 'jquery'
import ContentManager from './manager/content'
import CharController from './utils/char_controller'
import { randomColor, removeURL } from './utils'

/******************************************************/
const connect = (socket) => {
  if (socket) return socket
  socket = io(API_URL)
  socket.on('tweet', tweetHandler)
  socket.on('like', likeHandler)
  socket.on('retweet', likeHandler)
  socket.on('request_state', () => {
    socket.emit('get_state', r__manager.getState())
  })
  socket.on('show_comments', () => {
    r__controller.toggle(true)
  })
  socket.on('hide_comments', () => {
    r__controller.toggle(true)
  })
  socket.on('show_navigation', () => {
    r__manager.showNavigation()
  })
  socket.on('hide_navigation', () => {
    r__manager.hideNavigation()
  })
  socket.on('next_page', () => {
    r__manager.goNext()
  })
  socket.on('prev_page', () => {
    r__manager.goPrev()
  })

  socket.emit('join_room', { room: r__manager.room_id })
  return socket
}

const tweetHandler = (tweet) => {
  console.log(tweet)
  const size = 40 + 12 / tweet.length
  const color = randomColor()
  const text = removeURL(tweet)
  r__controller.addText({ body: text, size: size, color: color })
  r__manager.countUp('tweet', 1)
}

// ハッシュタグを含むツイートがいいねされた時にいいね！をランダムで表示したい
const likeHandler = (like) => {
  r__controller.addImage({
    url: chrome.extension.getURL('images/like.png'),
    width: '80px',
    height: '80px',
    direction: 'random',
    duration: 1500
  })
  r__manager.countUp('like', 1)
}

const createStream = (socket, params) => {
  socket.emit('recho', params)
}

const deleteStream = (socket, params) => {
  socket.emit('disrecho', params)
}

/******************************************************/
const API_URL = 'https://recho-api.herokuapp.com'
var r__manager = new ContentManager(location.hostname)
// var r__controller = new CharController('Flowly', r__manager.container)
var r__controller = new CharController('NewsTicker', r__manager.container)
var r__socket = undefined

chrome.extension.sendRequest({}, function(res) {})

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.method) {
    case 'update':
      console.log(request.dir)
      r__controller.update({ direction: request.dir })
      r__manager.update({ direction: request.dir })
      sendResponse(true)
      break
    case 'isRechoing':
      r__manager.generateRoomId(request.user_id)
      r__socket = connect(r__socket)
      sendResponse({ isRechoing: r__manager.isRechoing, room: r__manager.room_id })
      break
    case 'recho':
      const { hashtag, direction } = request
      createStream(r__socket, { hashtag: hashtag, room: r__manager.room_id })
      r__manager.recho(hashtag, direction, () => { sendResponse(true) })
      break
    case 'disrecho':
      deleteStream(r__socket, { room: r__manager.room_id })
      r__manager.disrecho(() => { sendResponse(true) })
      break
    default:
      break
  }
})
