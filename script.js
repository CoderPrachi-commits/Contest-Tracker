// storing contests so i dont call api again when filter changes
let upcomingData = []
let pastData = []
let activePlatform = 'ALL'

// platforms i want to show in filter
// got these names by checking what clist api returns in resource.name
const platformList = ['ALL', 'codeforces.com', 'leetcode.com', 'codechef.com', 'atcoder.jp', 'hackerearth.com', 'hackerrank.com']

// starting point of app
window.onload = function() {
  makeFilterButtons()
  loadContests()
}

// two api calls - one for upcoming one for past
// using todays date to split them
function loadContests() {
  document.getElementById('upcomingGrid').innerHTML = '<p class="loader">Loading...</p>'
  document.getElementById('pastGrid').innerHTML = '<p class="loader">Loading...</p>'

  // getting todays date dynamically so i dont have to hardcode it
  const today = new Date().toISOString().split('T')[0]
  console.log('today is', today)

  const upcomingUrl = 'https://clist.by/api/v1/json/contest/?username=dt_coder&api_key=8b89a22f5ea2c11ef10bb9b96c74137b8b105191&limit=100&format=json&order_by=start&start__gte=' + today

  const pastUrl = 'https://clist.by/api/v1/json/contest/?username=dt_coder&api_key=8b89a22f5ea2c11ef10bb9b96c74137b8b105191&limit=50&format=json&order_by=-start&start__lt=' + today

  // fetching upcoming contests
  fetch(upcomingUrl)
    .then(function(res) {
      return res.json()
    })
    .then(function(data) {
      console.log('upcoming contests loaded', data)
      upcomingData = data.objects
      showUpcoming(upcomingData)
    })
    .catch(function(err) {
      console.log('error loading upcoming', err)
      document.getElementById('upcomingGrid').innerHTML = '<p class="error">Something went wrong. Try refreshing.</p>'
    })

  // fetching past contests
  fetch(pastUrl)
    .then(function(res) {
      return res.json()
    })
    .then(function(data) {
      console.log('past contests loaded', data)
      pastData = data.objects
      showPast(pastData)
    })
    .catch(function(err) {
      console.log('error loading past', err)
      document.getElementById('pastGrid').innerHTML = '<p class="error">Something went wrong. Try refreshing.</p>'
    })
}

// creating filter buttons at top
function makeFilterButtons() {
  const filterBar = document.getElementById('filterBar')

  platformList.forEach(function(platform) {
    const btn = document.createElement('button')

    // removing .com and .jp so button text looks clean
    if (platform === 'ALL') {
      btn.textContent = 'ALL'
    } else {
      btn.textContent = platform.replace('.com', '').replace('.jp', '')
    }

    btn.classList.add('filter-btn')

    // first button active by default
    if (platform === 'ALL') btn.classList.add('active')

    btn.onclick = function() {
      // remove active from all buttons first
      document.querySelectorAll('.filter-btn').forEach(function(b) {
        b.classList.remove('active')
      })

      // add active to clicked button
      btn.classList.add('active')
      activePlatform = platform

      // re-filter already loaded data no new api call needed
      showUpcoming(upcomingData)
      showPast(pastData)
    }

    filterBar.appendChild(btn)
  })
}

// showing upcoming contests
function showUpcoming(contests) {
  const upcomingBox = document.getElementById('upcomingGrid')
  upcomingBox.innerHTML = ''

  // filtering by platform if user selected one
  let list = contests
  if (activePlatform !== 'ALL') {
    list = contests.filter(function(c) {
      return c.resource && c.resource.name === activePlatform
    })
  }

  // updating count badge
  document.getElementById('upcomingCount').textContent = list.length

  if (list.length === 0) {
    upcomingBox.innerHTML = '<p class="no-contests">No upcoming contests</p>'
    return
  }

  list.forEach(function(contest) {
    upcomingBox.appendChild(buildCard(contest, false))
  })
}

// showing past contests
function showPast(contests) {
  const pastBox = document.getElementById('pastGrid')
  pastBox.innerHTML = ''

  // filtering by platform if user selected one
  let list = contests
  if (activePlatform !== 'ALL') {
    list = contests.filter(function(c) {
      return c.resource && c.resource.name === activePlatform
    })
  }

  // updating count badge
  document.getElementById('pastCount').textContent = list.length

  if (list.length === 0) {
    pastBox.innerHTML = '<p class="no-contests">No past contests</p>'
    return
  }

  list.forEach(function(contest) {
    pastBox.appendChild(buildCard(contest, true))
  })
}

// building one contest card
function buildCard(contest, isOld) {
  const card = document.createElement('div')
  card.classList.add('card')

  // clist gives time as string so converting to readable date
  const startDate = new Date(contest.start)
  const niceDate = startDate.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  // duration is in seconds so converting to hours and minutes
  const hrs = Math.floor(contest.duration / 3600)
  const mins = Math.floor((contest.duration % 3600) / 60)
  let durationText = ''
  if (hrs > 0) durationText += hrs + 'h '
  if (mins > 0) durationText += mins + 'm'
  if (durationText === '') durationText = 'N/A'

  // platform name from resource
  const siteName = contest.resource ? contest.resource.name : 'Unknown'

  // checking if contest is live right now
  const timeNow = new Date().getTime()
  const startMs = new Date(contest.start).getTime()
  const endMs = new Date(contest.end).getTime()
  const isLive = timeNow >= startMs && timeNow <= endMs

  // deciding which status badge to show
  let statusBadge = ''
  if (isLive) {
    statusBadge = '<span class="badge-live">🔴 Live</span>'
  } else if (!isOld) {
    statusBadge = '<span class="badge-upcoming">Upcoming</span>'
  } else {
    statusBadge = '<span class="badge-past">Past</span>'
  }

  // unique id for this cards countdown timer
  const timerId = 'timer-' + contest.id

  // youtube search link for editorials of past contests
  const ytLink = 'https://www.youtube.com/results?search_query=' + encodeURIComponent(contest.event + ' editorial')

  // google calendar link for upcoming contests
  const calLink = buildCalendarLink(contest)

  // different buttons for past and upcoming
  let btnHtml = ''
  if (isOld) {
    btnHtml = `
      <a href="${contest.href}" target="_blank" class="btn-join">View Contest</a>
      <a href="${ytLink}" target="_blank" class="btn-youtube">▶ Editorial</a>
    `
  } else {
    btnHtml = `
      <a href="${contest.href}" target="_blank" class="btn-join">Join Contest</a>
      <a href="${calLink}" target="_blank" class="btn-calendar">+ Calendar</a>
    `
  }

  card.innerHTML = `
    <div class="badge-row">
      <span class="badge-platform">${siteName}</span>
      ${statusBadge}
    </div>
    <p class="card-name">${contest.event}</p>
    <div class="card-info">
      📅 ${niceDate}
    </div>
    <div class="card-info">
      ⏱ Duration: ${durationText}
    </div>
    <div class="countdown-row" id="${timerId}"></div>
    <div class="card-buttons">
      ${btnHtml}
    </div>
  `

  // start countdown only for upcoming contests
  if (!isOld) {
    startTimer(contest.start, contest.end, timerId)
  }

  return card
}

// countdown timer that ticks every second
function startTimer(startTime, endTime, timerId) {
  const timeNow = new Date().getTime()
  const startMs = new Date(startTime).getTime()
  const endMs = new Date(endTime).getTime()

  // if already live just show live badge
  if (timeNow >= startMs && timeNow <= endMs) {
    const el = document.getElementById(timerId)
    if (el) el.innerHTML = '<span class="countdown-box">🔴 Live Now</span>'
    return
  }

  const ticker = setInterval(function() {
    const now = new Date().getTime()
    const diff = startMs - now

    const el = document.getElementById(timerId)

    // stop timer if card is removed from page
    if (!el) {
      clearInterval(ticker)
      return
    }

    if (diff <= 0) {
      el.innerHTML = '<span class="countdown-box">🔴 Live Now</span>'
      clearInterval(ticker)
      return
    }

    // simple math to get days hours mins secs
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const secs = Math.floor((diff % (1000 * 60)) / 1000)

    let timerHtml = '<span class="countdown-label">Starts in</span>'

    if (days > 0) timerHtml += `<span class="countdown-box">${days}d</span>`
    timerHtml += `<span class="countdown-box">${hours}h</span>`
    timerHtml += `<span class="countdown-box">${mins}m</span>`
    timerHtml += `<span class="countdown-box">${secs}s</span>`

    el.innerHTML = timerHtml

  }, 1000)
}

// building google calendar link from contest details
function buildCalendarLink(contest) {
  const start = new Date(contest.start).toISOString().replace(/-|:|\.\d+/g, '')
  const end = new Date(contest.end).toISOString().replace(/-|:|\.\d+/g, '')

  const link = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${contest.event}&dates=${start}/${end}&details=Contest on ${contest.resource.name}`

  return link
}
