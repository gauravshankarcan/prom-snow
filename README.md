# Connecting your prometheus based alerts to an API based ITSM tool

## Overview

The article describes a mechanism to proxy a simple webhook to various ITSM tools .

In this article today, we are going to integrate openshift based prometheus to Service now .

### Prerequisite

- Assumes you have a fully configured prometheus instance, with alerting enabled on target namespace where you are creating the alerts
- Assumes you have the basic understanding of the openshift monitoring stack
- Assumes you have a working instance of ServiceNow or any other ITSM tool which can me managed via API

## Source Code and example

The repo is [provide here for reference](https://github.com/gauravshankarcan/prom-snow)

## Build the proxy

Lets built an proxy app using the docker image

```
oc new-app https://github.com/gauravshankarcan/prom-snow
```

Now that the app is running , it time to direct alerts to the proxy

Let create an alert with label matchers  ``alert=servicenow``

```
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  creationTimestamp: null
  labels:
    prometheus: example
    role: alert-rules
  name: prometheus-example-rules
spec:
  groups:
  - name: ./example.rules
    rules:
    - alert: ExampleAlert
      expr: vector(1)
      labels:
        alert: servicenow
```

create a receiver of type web hook  

> your url may be different based on your service
>
> Depending on how you have set up the service you may want to add
>
> ```
> http://<svc>:port  in the url below
> ```

![](images/receiver.PNG)

The moment alert fires next you will notice the output format in the logs of the proxy created earlier

The logs of the proxy pod will show something similar to below

```
{
receiver: 'servicenow',
status: 'firing',
alerts: [
{
status: 'firing',
labels: [Object],
annotations: {},
startsAt: '2023-01-19T21:03:53.112Z',
endsAt: '0001-01-01T00:00:00Z',
generatorURL: 'https://thanos-querier-openshift-monitoring.apps-crc.testing/api/graph?g0.expr=vector%281%29&g0.tab=1',
fingerprint: '3b86a
.
.
.
.
.
}
```

We are now going to use this request and translate this to a Servicenow compatible API ( similar process can be used for other ITSM tools )
