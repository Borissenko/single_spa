# Потоки между MF
//https://dev.to/luistak/cross-micro-frontends-communication-30m3#web-workers
//https://oskari.io/blog/event-bus-micro-frontend/

## С реактивностью
  > Custom Events     << единственно реальное.
  = BroadcastChannel
  = npm PubSub

## Без реактивности
  - props & callback
  - webWorker
  - localStorage
  - urlQuery
  - Вешаем метод на window.
  - PubSub



# props
1. //root-config/ORG-root-config.js

registerApplication({
  name: "@my5/vue2",
  app: () => System.import("@my5/vue2"),
  activeWhen: ["/"],
  customProps: {          //for vue, react
    authTk_0: 'TOKEN'    //<< start
  },
})

2. //MF/src/main.js
## vue
const vueLifecycles = singleSpaVue({
  Vue,
  appOptions: {
    render(h) {
      return h(App, {
        props: {
          authTk: this.authTk_0    //<< then
        },
      })
    },
  },
})

## react
export default function Root(props) {
  return (
    <div>
      {props.name} is mounted! 
    </div>
  )
}

3. //MF/src/App.vue
export default {
  name: 'App',
  props: ['authTk'],     //<< out
}





# Custom Events
- присутствует реактивность(!)

## 01. target - window.
a/
const addToCartEvent = new CustomEvent('ADD_TO_CART', { detail: { count: 25 } })
window.dispatchEvent(addToCartEvent)

b/
const listener = ({ detail }) => ...}
window.addEventListener('ADD_TO_CART', listener)


## 02. target - comment_element at the body.
// Creating a comment element
const elem = document.createComment("Event Bus")
document.body.appendChild(elem)

// Subscribe to messages
elem.addEventListener("channel-1", (event) => {
  console.log(event.detail)
});

// Publish messages
const event = new CustomEvent("channel-1", {
  detail: { message: "Hello World" },
})
elem.dispatchEvent(event)







# BroadcastChannel
- присутствует реактивность(!)

1. Connecting to a channel:
const BC = new BroadcastChannel("MyChannel")

2. Publishing a message
BC.postMessage({ data: { foo: "bar" } })
BC.postMessage("Test")

3. Subscribing to messages
BC.onmessage = (event) => {
  console.log(event)
}

4. Disconnecting
BC.close()





# npm PubSub
//https://www.npmjs.com/package/pubsub-js




# Custom PubSub
- текущее состояние надо проверять самостоятельно, АКТИВНО.
//https://oskari.io/blog/event-bus-micro-frontend/

export class PubSub {
  // Keep track of all `onMessage()` listeners with easy lookup by subscription id.
  private subscriberOnMsg: Record<ID, OnMessageFn> = {};
  // Keep track of the topic for each subscription id for easier cleanup.
  private subscriberTopics: Record<ID, Topic> = {};
  // Keep track of all topics and subscriber ids for each topic.
  private topics: Record<Topic, ID[]> = {};
}


## регистрация канала
1/ декларация кода
public subscribe(topic: Topic, onMessage: OnMessageFn): ID {
  // Validate inputs
  if (typeof topic !== "string") throw new Error("Topic must be a string.");
  if (typeof onMessage !== "function")
    throw new Error("onMessage must be a function.");
  // Each subscription has a unique id
  const subID = uuid();
  // Create or Update the topic
  if (!(topic in this.topics)) {
    // New topic
    this.topics[topic] = [subID];
  } else {
    // Topic exists
    this.topics[topic].push(subID);
  }
  // Store onMessage and topic separately for faster lookup
  this.subscriberOnMsg[subID] = onMessage;
  this.subscriberTopics[subID] = topic;
  // Return the subscription id
  return subID;
}

2/ активация
const PS = new PubSub()

const subId = PS.subscribe("myTopic", (message) => {
  console.log({ message })
})


## Публикация сообщения
1/ декларация кода
public publish(topic: Topic, message: Record<string, unknown>) {
  if (typeof topic !== "string") throw new Error("Topic must be a string.");
  if (typeof message !== "object") {
    throw new Error("Message must be an object.");
  }
  // If topic exists post messages
  if (topic in this.topics) {
    const subIDs = this.topics[topic];
    subIDs.forEach((id) => {
      if (id in this.subscriberOnMsg) {
        this.subscriberOnMsg[id](message);
      }
    });
  }
}


2/ активация
const PS = new PubSub()
PS.publish("myTopic", { message: "Hello World" })



## Удаление канала
public unsubscribe(id: ID): void {
  // Validate inputs
  if (typeof id !== "string" || !validateUUID(id)) {
  throw new Error("ID must be a valid UUID.");
}
// If the id exists in our subscriptions then clear it.
if (id in this.subscriberOnMsg && id in this.subscriberTopics) {
  // Delete message listener
  delete this.subscriberOnMsg[id];
  // Remove id from the topics tracker
  const topic = this.subscriberTopics[id];
  // Cleanup topics
  if (topic && topic in this.topics) {
    const idx = this.topics[topic].findIndex((tID) => tID === id);
    if (idx > -1) {
      this.topics[topic].splice(idx, 1);
    }
    // If there are no more listeners clean up the topic as well
    if (this.topics[topic].length === 0) {
      delete this.topics[topic];
    }
  }
  // Delete the topic for this id
  delete this.subscriberTopics[id];
}
}







