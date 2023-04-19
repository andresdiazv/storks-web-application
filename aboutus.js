const tabHeader = document.querySelectorAll('.tab-header')
const tabContent = document.querySelectorAll('.tab-content')

tabHeader.forEach(element => {
    element.addEventListener('click', tabClick)
})

function tabClick(tab){
    tabContent.forEach((element, index) => {
        if(index === parseInt(tab.target.dataset.index)){
            element.classList.toggle('hide')
        } else {
            element.classList.add('hide')
        }
    })
}