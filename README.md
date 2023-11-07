# Todoist Kanban Card

<!-- [![hacs_badge](https://img.shields.io/badge/HACS-Default-orange.svg)](https://github.com/hacs/integration) -->
![hacs_badge](https://img.shields.io/github/v/release/corte/todoist-kanban-card)
![hacs_badge](https://img.shields.io/github/license/corte/todoist-kanban-card)

Todoist kanban card for [Home Assistant](https://www.home-assistant.io) Lovelace UI. This card displays items from selected Todoist project in a kanban format.

Light theme |  Dark theme
:-------------------------:|:-------------------------:
![todoist-kanban-card-light](https://github.com/corte/todoist-kanban-card/assets/4606160/9fb8fabe-93c1-487d-abc8-6f8ecbf194bd)  |  ![todoist-kanban-card-dark](https://github.com/corte/todoist-kanban-card/assets/4606160/2a80caeb-7238-448e-8bcf-99d17a1c6ade)

## Installing

<!-- ### HACS

This card is available in [HACS](https://hacs.xyz) (Home Assistant Community Store).

Just search for `Todoist Card` in HACS `Frontend` tab. -->

### Manual

1. Download `todoist-kanban-card.js` file from the [latest release](https://github.com/grinstantin/todoist-card/releases/latest).
2. Put `todoist-kanban-card.js` file into your `config/www` folder.
3. Add a reference to `todoist-kanban-card.js` in Lovelace. There's two way to do that:
   1. **Using UI:** _Configuration_ → _Lovelace Dashboards_ → _Resources_ → Click Plus button → Set _Url_ as `/local/todoist-kanban-card.js` → Set _Resource type_ as `JavaScript Module`.
   2. **Using YAML:** Add the following code to `lovelace` section.
      ```yaml
      resources:
        - url: /local/todoist-kanban-card.js
          type: module
      ```
4. Add `custom:todoist-kanban-card` to Lovelace UI as any other card (using either editor or YAML configuration).

## Using the card

This card can be configured using Lovelace UI editor.

1. Add the following code to `configuration.yaml`:
    ```yaml
    sensor:
      - platform: rest
        name: To-do List
        method: GET
        resource: 'https://api.todoist.com/sync/v9/projects/get_data'
        params:
          project_id: <TODOIST_PROJECT_ID>
        headers:
          Authorization: !secret todoist_api_token
        value_template: '{{ value_json[''project''][''id''] }}'
        json_attributes:
          - project
          - items
          - sections
        scan_interval: 600

    rest_command:
      todoist:
        method: post
        url: 'https://api.todoist.com/sync/v9/{{ url }}'
        payload: '{{ payload }}'
        headers:
          Authorization: !secret todoist_api_token
        content_type: 'application/x-www-form-urlencoded'
    ```
2. ... and to `secrets.yaml`:
    ```yaml
    todoist_api_token: 'Bearer <TODOIST_API_TOKEN>'
    ```
3. Replace `<TODOIST_API_TOKEN>` with your [token](https://todoist.com/prefs/integrations) and `<TODOIST_PROJECT_ID>` with ID of your selected Todoist project.
    > You can get `<TODOIST_PROJECT_ID>` from project URL, which usually looks like this:
    `https://todoist.com/app/project/<project_name>-<TODOIST_PROJECT_ID>`
4. Reload configs or restart Home Assistant.
5. In Lovelace UI, click 3 dots in top left corner.
6. Click _Edit Dashboard_.
7. Click _Add Card_ button in the bottom right corner to add a new card.
8. Find _Custom: Todoist Kanban Card_ in the list.
9. Choose `entity`
    > If you named your sensor `To-do List` like suggested here your entity will be called  `sensor.to_do_list`
10. Now you should see the preview of the card!

Typical example of using this card in YAML config would look like this:

```yaml
type: 'custom:todoist-kanban-card'
entity: sensor.to_do_list
show_header: true
show_item_add: true
show_item_delete: true
```

Here is what every option means:

| Name                 |   Type    |   Default    | Description                                                                                           |
| -------------------- | :-------: | :----------: | ----------------------------------------------------------------------------------------------------- |
| `type`               | `string`  | **required** | `custom:todoist-kanban-card`
| `entity`             | `string`  | **required** | An entity_id within the `sensor` domain.
| `show_header`        | `boolean` | `true`       | Show friendly name of the selected `sensor` in the card header.
| `show_item_add`      | `boolean` | `true`       | Show text input element for adding new items to the list. Only shown in the first column of the board.
| `show_item_delete`   | `boolean` | `true`       | Show `delete` buttons. Only shown in the last column of the board.
| `only_today_overdue` | `boolean` | `false`      | Only show tasks that are overdue or due today.

<!-- > Note that the completed tasks list is cleared when the page is refreshed. -->

## Actions

- _Right arrow_ Move the task to next column in the board.
- _Left arrow_ Move the task to the previous column in the board.
- _Cross_ deletes selected task (Deletes it directly from Todoist archive).
- _Input_ adds new item to the list after pressing `Enter` or clicking on the _+_ icon.

## License

MIT © [Bruno Corte](https://github.com/corte)
