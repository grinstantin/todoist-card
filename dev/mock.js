const mockConfig = {
  "entity": "sensor:todoist",
  "show_header": true,
  "show_item_add": true,
  "show_item_delete": true,
  "only_today_overdue": false
};

const mockHass = {
  "states": {
    "sensor:todoist": {
      "state": "123456789",
      "attributes": {
        "friendly_name": "Kanban board",
        "project": {
          "created_at": "2023-10-30T11:55:02Z",
          "id": "123456789",
          "name": "Home 🏡",
          "view_style": "board"
        },
        "items": [
          {
            "added_at": "2023-11-01T12:29:40.692017Z",
            "content": "Fix kitchen lights",
            "description": "",
            "due": null,
            "duration": null,
            "id": "111111111",
            "project_id": "123456789",
            "section_id": "234567890"
          },
          {
            "added_at": "2023-11-01T13:46:10.849666Z",
            "content": "Book tickets to Paris",
            "description": "",
            "due": null,
            "duration": null,
            "id": "222222222",
            "project_id": "123456789",
            "section_id": "234567890"
          },
          {
            "added_at": "2023-11-01T13:48:33.899477Z",
            "content": "Take out the trash",
            "description": "",
            "due": null,
            "duration": null,
            "id": "333333333",
            "project_id": "123456789",
            "section_id": "234567890"
          },
          {
            "added_at": "2023-11-01T13:49:11.206172Z",
            "content": "Buy gift to Anna",
            "description": "She likes jewelry, maybe a necklace",
            "due": null,
            "duration": null,
            "id": "444444444",
            "project_id": "123456789",
            "section_id": "234567891"
          },
          {
            "added_at": "2023-10-30T11:55:03.226473Z",
            "content": "Clean the apartment",
            "description": "",
            "due": null,
            "duration": null,
            "id": "555555555",
            "project_id": "123456789",
            "section_id": "234567892"
          },
          {
            "added_at": "2023-10-30T11:55:03.226473Z",
            "content": "Make dentist appointment",
            "description": "Either monday or wednesday works",
            "due": null,
            "duration": null,
            "id": "666666666",
            "project_id": "123456789",
            "section_id": "234567892"
          }          
        ],
        "sections": [
          {
            "added_at": "2023-11-01T13:53:12.936599Z",
            "id": "234567890",
            "name": "To do 🛠",
            "project_id": "123456789",
            "section_order": 1
          },
          {
            "added_at": "2023-10-30T11:55:03.014306Z",
            "id": "234567891",
            "name": "In progress 🔁",
            "project_id": "123456789",
            "section_order": 2
          },
          {
            "added_at": "2023-10-30T11:55:03.333344Z",
            "id": "234567892",
            "name": "Done ✨",
            "project_id": "123456789",
            "section_order": 3
          }
        ]
      }
    }
  },
  "callService": () => Promise.resolve(),
};

(() => {
  let elem = document.createElement('todoist-kanban-card')
  elem.config = mockConfig;
  elem.hass = mockHass;

  let card = document.getElementById("renderer");
  
  card.appendChild(elem);
})();
