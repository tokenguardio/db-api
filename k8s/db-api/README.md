# Helm chart for TG db-api deployment
For secure secret storage in repo, chart evaluates secrets from AWS Parameter Store. Chart utilizes [helm-secrets](https://github.com/jkroepke/helm-secrets).  
In order to make it work with `--evaluate-templates` you need to install also [helmfile/vals](https://github.com/helmfile/vals/releases/latest).  
In order to install `vals` head to releases page, download package relevant for your arch (`darwin_arm64` for M1 Macs and `darwin_amd64` for older Macs), unpack it and copy `vals` file to `/usr/local/bin` directory. 
```
mkdir helm-vals
cd helm-vals
wget https://github.com/helmfile/vals/releases/download/v0.23.0/vals_0.23.0_darwin_amd64.tar.gz  -O - | tar -xz
cp vals /usr/local/bin
```
it might be necessary to enable binary from unrecognized developer in MacOS security settings.  
After installation in order for proper secrets evaluation you need to configure proper kubectl context. For dev env it will look similar to this:
```
export KUBECONFIG=~/.kube/tokenguard-dev
export AWS_PROFILE=tokenguard-dev
export AWS_REGION=eu-west-1
```
in order to test the configuration run
```
aws ssm describe-parameters
```
you should be presented with the list of secrets stored in AWS SSM Parameter Store (they should start with /tokenguard-dev/*)

# Install/Upgrade deployments
```
cd k8s/db-api
helm secrets --evaluate-templates upgrade -i db-api template/ --values template/values.yaml -f environment/dev/values.yaml --namespace dev --set ecrRegistry=<ecr registry uri>
```
