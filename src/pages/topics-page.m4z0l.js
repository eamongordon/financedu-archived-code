import { getRouterData } from 'wix-window';
import wixLocation from 'wix-location';

let articlesDataArr;
let quizzesDataArr;

$w.onReady(async function () {
    let routerData = getRouterData();
    articlesDataArr = [];
    while (routerData.articles.length) {
        articlesDataArr.push(routerData.articles.splice(0, 2));
    }
    console.log($w("#vectorImage").src);
    $w('#articleRepeater').data = articlesDataArr[0];
    $w('#articlePagination').totalPages = (articlesDataArr.length === 0) ? 1 : articlesDataArr.length;
    $w('#articlePagination').currentPage = 1;
    quizzesDataArr = [];
    while (routerData.quizzes.length) {
        quizzesDataArr.push(routerData.quizzes.splice(0, 2));
    }
    $w('#quizRepeater').data = quizzesDataArr[0];
    $w('#quizPagination').totalPages = (quizzesDataArr.length === 0) ? 1 : quizzesDataArr.length;
    $w('#quizPagination').currentPage = 1;
    $w('#topicName').text = routerData.topic.title;
    $w('#topicDescription').text = routerData.topic.description;
    $w('#vectorImage').src = routerData.topic.vectorSrc;
    $w('#articlePagination').onChange((event) => {
        $w('#articleRepeater').data = articlesDataArr[event.target.currentPage - 1];
    });
    $w('#quizPagination').onChange((event) => {
        $w('#quizRepeater').data = quizzesDataArr[event.target.currentPage - 1];
    });
});

export function articleRepeater_itemReady($item, itemData, index) {
    $item('#articleTitleTxt').text = itemData.title;
    let textContent = '';
    while (textContent.length <= 200) {
        for (let i = 0; i < itemData.richContent.nodes.length; i++) {
            if (itemData.richContent.nodes[i].type === 'PARAGRAPH') {
                if (itemData.richContent.nodes[i].nodes.length > 0) {
                    textContent = textContent + ` ${itemData.richContent.nodes[i].nodes[0].textData.text}`;
                }
            }
        }
    }
    textContent = textContent.substring(0, 200) + '...';
    $item('#articleDescription').text = textContent;
    //$item('#activityTypeTxt').text = itemData.type;

}

export function articleContainer_click(event) {
    wixLocation.to(`/activity/${event.context.itemId}`);
}

export function quizContainer_click(event) {
    wixLocation.to(`/activity/${event.context.itemId}`);
}


export function quizRepeater_itemReady($item, itemData, index) {
    $item('#quizTitleTxt').text = itemData.title;
    if (itemData.data.length === 1) {
        $item('#questionCountTxt').text = `${itemData.data.length} Question`;
    } else {
        $item('#questionCountTxt').text = `${itemData.data.length} Questions`;
    }
    $w('#loadingGif').hide();
    $w('#articleStrip, #quizStrip').expand();
}
