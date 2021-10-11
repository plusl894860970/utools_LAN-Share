<template>
	<div id="app">
		<el-upload
			action="#"
			:http-request="fileSeclected"
			:show-file-list="false"
		>
			<el-button type="primary" style="marigin: 15px" round
				>分享文件</el-button
			>
		</el-upload>
		<el-table :data="tableData" style="width: 100%" height="400">
			<!-- <el-table-column prop="name" label="文件名" /> -->
			<el-table-column prop="path" label="文件路径" />
			<el-table-column prop="url" label="下载链接" />
			<el-table-column label="文件大小" width="100">
				<template #default="scope">
					{{ (scope.row.size / 1000000).toFixed(2) }}Mb
				</template>
			</el-table-column>
			<el-table-column label="操作" width="200">
				<template #default="scope">
          <el-button
            size="mini"
            plain
						@click="copyLink(scope.row.url)"
						>复制链接</el-button
					>
					<el-button
						type="danger"
            size="mini"
            plain
						@click="cancelShare(scope.row)"
						>取消共享</el-button
					>
				</template>
			</el-table-column>
		</el-table>
	</div>
</template>
<script lang="ts">
import { ElMessage } from 'element-plus';
import { onMounted, reactive, ref } from 'vue';
interface File {
	name: string;
	url: string;
	path: string;
	size: number;
}
declare global {
	interface Window {
		api?: {
			startServer: any;
			stopServer: any;
			add: any;
			remove: any;
			clear: any;
			values: any;
			getIPAddress: any;
		};
		utools?: {
			onPluginReady: any;
			setExpendHeight: any;
      copyText: any;
		};
	}
}
export default {
	setup() {
		const files: Array<File> = [];
		const tableData = reactive(files);
		const getFiles = async () => {
			if (!window.api?.values) return;
			tableData.length = 0;
			const { data } = await window.api.values();
			tableData.push(...data);
		};
		const addFile = async (file: File) => {
			if (!window.api?.add) return;
			tableData.push(file);
			await window.api.add(file);
		};
		const cancelShare = async (row: File) => {
			if (!window.api?.remove) return;
			await window.api.remove(row);
			const newTableData = tableData.filter((o) => o.name !== row.name);
			tableData.length = 0;
			tableData.push(...newTableData);
		};
		const host = ref('');
		// 选择文件
		const fileSeclected = async (e: any) => {
			const { file } = e;
			const { name, size, path } = file;
			const obj: File = {
				name,
				size,
				path,
				url: `http://${host.value}:9527/download/${name}`,
			};
			console.log('选择文件', obj);
			await addFile(obj);
		};
		const ready = ref(false);
    // 复制
    const copyLink = (link: string) => {
      window.utools.copyText(link)
      ElMessage.success('复制成功')
    }
		onMounted(async () => {
			window.utools.onPluginReady(() => {
				ready.value = true;
			});
			while (!ready.value) {
				await new Promise((resolve) => setTimeout(resolve, 1000));
			}
			if (window.api?.startServer) await window.api.startServer();
			window.utools.setExpendHeight(460);
			if (window.api?.getIPAddress)
				host.value = await window.api.getIPAddress();
			await getFiles();
		});
		return { tableData, cancelShare, fileSeclected, copyLink };
	},
};
</script>

<style scoped>
* {
	padding: 0;
	margin: 0;
}
</style>
