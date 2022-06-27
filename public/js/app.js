fetch('/api/v1/points', {
})
    .then(response => response.json())
    .then(content => {

        for (const [key, value] of Object.entries(content)) {
            document.getElementById(value.equipe).innerText = parseInt(document.getElementById(value.equipe).innerText)+value.kills
            const div = document.createElement('div')
            div.classList.add('carte')
            const username = document.createElement('p')
            username.classList.add('pseudo')
            username.innerText = `${key}`
            const nb_kills = document.createElement('p')
            if (value == 1) {
                nb_kills.innerHTML = `A déjà fait ${value.kills} victime !`
            }
            else {
                nb_kills.innerHTML = `A déjà fait ${value.kills} victimes !`
            }
            const img = document.createElement('img')
            img.src = `https://mc-heads.net/avatar/${key}`
            div.appendChild(img)
            div.appendChild(username)
            div.appendChild(nb_kills)
            document.getElementById(`${value.equipe}1`).appendChild(div)
        }
    })