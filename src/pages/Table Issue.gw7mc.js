// Velo API Reference: https://www.wix.com/velo/reference/api-overview/introduction

$w.onReady(function () {
    $w("#table").columns = [{
            "visible": true,
            "id": "column_l5n3eh5j",
            "dataPath": "student",
            "label": "Student",
            "width": 250,
            "type": "string"
        },
        {
            "visible": true,
            "id": "aa041008-35e7-4bd2-8483-4b9ea6b6e624",
            "dataPath": "aa041008-35e7-4bd2-8483-4b9ea6b6e624",
            "label": "A guide to SMART Goals",
            "width": 176,
            "type": "richText"
        },
        {
            "visible": true,
            "id": "8ddf5fb6-14fc-4c0f-bc92-f37901afe6f3",
            "dataPath": "8ddf5fb6-14fc-4c0f-bc92-f37901afe6f3",
            "label": "Lesson 1: About Finance",
            "width": 176,
            "type": "richText"
        },
        {
            "visible": true,
            "id": "637c9a52-0f33-4c70-838c-939df573ef14",
            "dataPath": "637c9a52-0f33-4c70-838c-939df573ef14",
            "label": "Sample 1",
            "width": 176,
            "type": "richText"
        },
        {
            "visible": true,
            "id": "dcc75af5-8213-43a9-b84f-e3cb37d8d97b",
            "dataPath": "dcc75af5-8213-43a9-b84f-e3cb37d8d97b",
            "label": "Second Assignment",
            "width": 176,
            "type": "richText"
        }
    ];
    $w('#table').rows = [{
        "link-people-name": "/people/admin-user",
        "name": "Admin User",
        "email": "ekeokigordon@icloud.com",
        "_id": "2dcc6c62-bd62-4b8c-b16f-7a821c7c9db3",
        "_owner": "2dcc6c62-bd62-4b8c-b16f-7a821c7c9db3",
        "_createdDate": {
            "$date": "2023-01-21T05:53:41.323Z"
        },
        "_updatedDate": {
            "$date": "2023-05-26T23:41:28.605Z"
        },
        "link-people-1-name-2": "/messages/2dcc6c62-bd62-4b8c-b16f-7a821c7c9db3",
        "lastName": "User",
        "firstName": "Admin",
        "classesOrderData": [],
        "student": "Admin User",
        "637c9a52-0f33-4c70-838c-939df573ef14": "<p style=\"color: #757575; font-size:18px;\"><span style=\"font-size:18px;\">75</span></p>",
        "submissionId": "90eea292-e385-4d4b-8e26-137dbae6b761",
        "637c9a52-0f33-4c70-838c-939df573ef14_$html": "<p style=\"color: #757575; font-size:18px;\"><span style=\"font-size:18px;\">75</span></p>"
    }]
});

export function table_cellSelect(event) {
    let cellColId = event.cellColumnId; // "columnId_b2b3-87d9-49250"
    let cellData = event.cellData; // "John"
    let cellRowIndex = event.cellRowIndex;
    if (cellData) {
        $w('#text187').text = cellColId;
        console.log(cellData)
    }
}