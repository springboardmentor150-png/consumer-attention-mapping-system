const shopperTable = document.querySelector("#shopperTable");

const shopperCount = document.getElementById("totalShoppers");
const attentionTime = document.getElementById("attentionTime");
const shopperSegment = document.getElementById("shopperSegment");


// ---------------- SHOPPER ANALYTICS ----------------

async function loadShoppers() {

    try {

        const response = await fetch(
            "http://127.0.0.1:8000/analytics/shoppers?cache=" + Date.now()
        );

        const data = await response.json();


        const shoppers = data.shoppers || {};


        shopperTable.innerHTML = "";


        let total = 0;
        let latestAttention = 0;
        let latestSegment = "-";


        for (const id in shoppers) {

            const shopper = shoppers[id];


            total++;

            latestAttention = shopper.attention_time;
            latestSegment = shopper.segment;


            shopperTable.innerHTML += `
            <tr>
                <td>${shopper.shopper_id}</td>
                <td>${shopper.attention_time.toFixed(2)} sec</td>
                <td>${shopper.segment}</td>
                <td>${shopper.updated_at}</td>
            </tr>
            `;
        }


        shopperCount.innerText = total;

        attentionTime.innerText =
            latestAttention.toFixed(2) + " sec";

        shopperSegment.innerText =
            latestSegment;


    } catch(error) {

        console.log("Shopper loading error:", error);

    }

}


loadShoppers();

setInterval(loadShoppers, 15000);



// ---------------- HEATMAP ----------------


const canvas = document.getElementById("heatmapCanvas");
const ctx = canvas.getContext("2d");


async function loadHeatmap() {


    try {

        const response = await fetch(
            "http://127.0.0.1:8000/analytics/heatmap?cache=" + Date.now()
        );


        const points = await response.json();


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        points.forEach(point => {


            ctx.beginPath();


            ctx.arc(
                point.x,
                point.y,
                15,
                0,
                Math.PI * 2
            );


            ctx.fillStyle =
                "rgba(255,0,0,0.35)";


            ctx.fill();


        });


    } catch(error) {

        console.log("Heatmap error:", error);

    }

}


loadHeatmap();

setInterval(loadHeatmap, 15000);

async function loadRecommendations() {

    const response = await fetch(
        "http://127.0.0.1:8000/analytics/recommendations?cache=" + Date.now()
    );

    const data = await response.json();

    const box = document.getElementById("recommendationBox");

    if (!data || Object.keys(data).length === 0) {

        box.innerHTML = "No recommendations available";

        return;
    }


    box.innerHTML = "";


    for (const id in data) {

        const recommendation = data[id];


        box.innerHTML += `

        <div class="recommendation">

            <h4>${recommendation.product_id}</h4>

            <p>
            ${recommendation.recommendation}
            </p>

            <small>
            Updated: ${recommendation.updated_at}
            </small>

        </div>

        `;

    }

}


loadRecommendations();


setInterval(() => {

    loadRecommendations();

}, 5000);