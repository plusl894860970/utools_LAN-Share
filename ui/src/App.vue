<template>
	<div id="app">
		<el-upload
			action="#"
			:http-request="fileSeclected"
			:show-file-list="false"
			multiple
			drag
			style="width: 100%"
			@click="clickUpload"
		>
			<div class="header" style="padding: 15px">
				<el-button id="upload" type="primary" round>分享文件</el-button>
			</div>
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
							@click.prevent="copyLink(scope.row.url)"
							>复制链接</el-button
						>
						<el-button
							type="danger"
							size="mini"
							plain
							@click.prevent="cancelShare(scope.row)"
							>取消共享</el-button
						>
					</template>
				</el-table-column>
			</el-table>
		</el-upload>
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
				url: `http://${host.value}:9527/download/${encodeURIComponent(name)}`,
			};
			console.log('选择文件', obj);
			await addFile(obj);
		};
		const ready = ref(false);
		// 复制
		const copyLink = (link: string) => {
			window.utools.copyText(link);
			ElMessage.success('复制成功');
		};
		// 点击表格
		let clickedButton = false;
		const clickUpload = (e: any) => {
			const tagsName = e.path.map((el: any) => {
				if (el.id === 'upload') {
					clickedButton = true;
					const inputs =
						document.getElementsByClassName('el-upload__input');
					const upload: HTMLElement = inputs[0] as HTMLElement;
					if (upload) upload.click();
				}
				return el && el.tagName;
			});
			if (tagsName.includes('INPUT')) {
				if (clickedButton) clickedButton = false;
				else e.preventDefault();
			} else {
				clickedButton = false;
				e.preventDefault();
			}
		};
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
		return { tableData, cancelShare, fileSeclected, copyLink, clickUpload };
	},
};
</script>

<style>
* {
	padding: 0;
	margin: 0;
}
#app {
	width: 100vw;
	height: 100vh;
	overflow: hidden;
}
.el-upload {
	width: 100vw !important;
}
.el-upload-dragger {
	width: 100% !important;
	height: 100vh !important;
	text-align: left !important;
	border: none !important;
	cursor: default !important;
}
</style>
