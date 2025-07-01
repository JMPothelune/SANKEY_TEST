export const bubbleApiCalls = [
  {
    name: "Get Liste Propreté",
    endpoint: "proprete",
    method: "GET",
    params: [
      { name: "isLive", label: "Utiliser l'API Live ?", type: "boolean", required: true }
    ]
  },
  {
    name: "Get Liste Qualité",
    endpoint: "qualite",
    method: "GET",
    params: [
      { name: "isLive", label: "Utiliser l'API Live ?", type: "boolean", required: true }
    ]
  },
  {
    name: "Get lot",
    endpoint: "lot?id={id}",
    method: "POST",
    params: [
      { name: "isLive", label: "Utiliser l'API Live ?", type: "boolean", required: true },
      { name: "id", label: "Unique Bubble ID", type: "string", required: true }
    ]
  }
]; 